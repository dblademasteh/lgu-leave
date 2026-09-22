import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

const createSchema = z.object({
  leaveTypeCode: z.string(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional(),
  isHalfDay: z.boolean().optional().default(false)
});

router.use(requireAuth);

router.get('/', async (req, res) => {
  const user = req.user;
  const where = user.role === 'ADMIN' || user.role === 'HR_MANAGER' ? {} : { employeeId: user.sub };
  const leaves = await prisma.leaveRequest.findMany({
    where,
    include: { employee: true, leaveType: true, approvals: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(leaves);
});

router.post('/', async (req, res) => {
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid input' });
  const { leaveTypeCode, startDate, endDate, reason, isHalfDay } = parse.data;
  const leaveType = await prisma.leaveType.findUnique({ where: { code: leaveTypeCode } });
  if (!leaveType) return res.status(400).json({ error: 'Leave type not found' });

  const start = new Date(startDate);
  const end = new Date(endDate);

  // count weekdays excluding holidays
  let days = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
    const day = new Date(d);
    const dow = day.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekend
    const iso = day.toISOString().slice(0,10);
    const isHoliday = await prisma.holiday.findFirst({ where: { date: { gte: new Date(iso), lte: new Date(iso+'T23:59:59') } } });
    if (isHoliday) continue;
    days++;
  }
  if (isHalfDay) days = days ? days - 0.5 : 0.5;

  const employee = await prisma.employee.findUnique({ where: { id: req.user.sub } });
  const year = start.getFullYear();
  const balance = await prisma.leaveBalance.findUnique({ where: { employeeId_leaveTypeId_year: { employeeId: req.user.sub, leaveTypeId: leaveType.id, year } } });
  if (!balance || balance.balance - balance.used < days) {
    return res.status(400).json({ error: 'Insufficient leave balance' });
  }

  const overlap = await prisma.leaveRequest.findFirst({
    where: {
      employeeId: req.user.sub,
      status: { in: ['PENDING','APPROVED'] },
      OR: [
        { startDate: { lte: end }, endDate: { gte: start } }
      ]
    }
  });
  if (overlap) {
    return res.status(400).json({ error: 'Overlapping leave request exists' });
  }

  const reqRow = await prisma.leaveRequest.create({
    data: {
      employeeId: req.user.sub,
      leaveTypeId: leaveType.id,
      startDate: start,
      endDate: end,
      days,
      isHalfDay,
      reason
    }
  });

  // Role-based approver selection per leave type
  const approverRoles = {
    VL: ['DEPARTMENT_HEAD', 'HR_MANAGER'],
    SL: ['DEPARTMENT_HEAD'],
    GL: ['DEPARTMENT_HEAD', 'HR_MANAGER', 'ADMIN']
  };
  const roles = approverRoles[leaveTypeCode] || ['HR_MANAGER'];
  const firstRole = roles[0];
  const approver = await prisma.employee.findFirst({
    where: { role: firstRole, department: employee?.department || undefined }
  });

  if (approver) {
    await prisma.approval.create({
      data: { leaveRequestId: reqRow.id, approverId: approver.id }
    });
  }

  const created = await prisma.leaveRequest.findUnique({
    where: { id: reqRow.id },
    include: { leaveType: true, approvals: { include: { approver: true } } }
  });
  res.status(201).json(created);
});

router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const updated = await prisma.leaveRequest.update({ where: { id }, data: { status }});
  res.json(updated);
});

router.post('/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { decision, comment } = req.body;
  const leave = await prisma.leaveRequest.findUnique({ where: { id }, include: { approvals: true } });
  if (!leave) return res.status(404).json({ error: 'Not found' });

  const pending = leave.approvals.find(a => !a.decision && a.approverId === req.user.sub);
  if (!pending) return res.status(403).json({ error: 'Not authorized to approve' });

  await prisma.approval.update({ where: { id: pending.id }, data: { decision, comment, decidedAt: new Date() } });

  const remaining = leave.approvals.filter(a => !a.decision);
  const newStatus = decision === 'REJECT' ? 'REJECTED' : remaining.length === 0 ? 'APPROVED' : 'PENDING';
  await prisma.leaveRequest.update({ where: { id }, data: { status: newStatus } });

  // Create next approver if pending remains in chain
  if (newStatus === 'PENDING') {
    const leaveType = await prisma.leaveType.findUnique({ where: { id: leave.leaveTypeId } });
    const approverRoles = {
      VL: ['DEPARTMENT_HEAD', 'HR_MANAGER'],
      SL: ['DEPARTMENT_HEAD'],
      GL: ['DEPARTMENT_HEAD', 'HR_MANAGER', 'ADMIN']
    };
    const roles = approverRoles[leaveType.code] || ['HR_MANAGER'];
    const decidedIdx = leave.approvals.findIndex(a => a.id === pending.id);
    const nextRole = roles[decidedIdx + 1];
    if (nextRole) {
      const employee = await prisma.employee.findUnique({ where: { id: leave.employeeId } });
      const nextApprover = await prisma.employee.findFirst({
        where: { role: nextRole, department: employee?.department || undefined }
      });
      if (nextApprover) {
        await prisma.approval.create({ data: { leaveRequestId: id, approverId: nextApprover.id } });
      }
    }
  }

  if (newStatus === 'APPROVED') {
    const year = new Date(leave.startDate).getFullYear();
    await prisma.leaveBalance.update({
      where: { employeeId_leaveTypeId_year: { employeeId: leave.employeeId, leaveTypeId: leave.leaveTypeId, year } },
      data: { used: { increment: leave.days } }
    });

    // Outbound HRMS sync fire-and-forget
    const hrmsBase = process.env.HRMS_BASE_URL;
    if (hrmsBase) {
      (async () => {
        try {
          const payload = {
            employeeNumber: (await prisma.employee.findUnique({ where: { id: leave.employeeId } }))?.employeeNumber,
            leaveType: (await prisma.leaveType.findUnique({ where: { id: leave.leaveTypeId } }))?.code,
            startDate: leave.startDate.toISOString().slice(0,10),
            endDate: leave.endDate.toISOString().slice(0,10),
            days: leave.days
          };
          await fetch(`${hrmsBase}/integrations/attendance/leave`, {
            method: 'POST',
            headers: { 'x-api-key': process.env.HRMS_API_KEY || '', 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          await prisma.syncLog.create({ data: { direction: 'OUTBOUND', source: 'API', entity: 'LeaveRequest', entityId: id, status: 'SUCCESS' } });
        } catch (e) {
          await prisma.syncLog.create({ data: { direction: 'OUTBOUND', source: 'API', entity: 'LeaveRequest', entityId: id, status: 'FAILED', message: String(e) } });
        }
      })();
    }
  }

  res.json({ ok: true, status: newStatus });
});

export default router;
