import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
const prisma = new PrismaClient();
const router = Router();

router.use(requireAuth);

router.get('/csc', async (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const leaves = await prisma.leaveRequest.findMany({
    where: {
      status: { in: ['APPROVED','REJECTED'] },
      startDate: { gte: new Date(`${year}-01-01`), lt: new Date(`${year+1}-01-01`) }
    },
    include: { employee: true, leaveType: true }
  });

  const headers = ['Employee Number','Full Name','Department','Leave Type','Start Date','End Date','Days','Status','Reason'];
  const rows = leaves.map(l => [
    l.employee.employeeNumber,
    l.employee.fullName,
    l.employee.department || '',
    l.leaveType.code,
    new Date(l.startDate).toISOString().slice(0,10),
    new Date(l.endDate).toISOString().slice(0,10),
    l.days,
    l.status,
    (l.reason || '').replace(/,/g,' ')
  ]);

  const csv = [headers.join(','), ...rows.map(r=>r.map(v=>`"${v}"`).join(','))].join('\n');
  res.setHeader('Content-Type','text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="CSC_Leave_Monitoring_${year}.csv"`);
  res.send(csv);
});

export default router;
