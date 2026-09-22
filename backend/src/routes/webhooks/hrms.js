import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const router = Router();

function verifySignature(req) {
  const sig = req.headers['x-hrms-signature'];
  const secret = process.env.HRMS_WEBHOOK_SECRET || '';
  if (!secret) return true;
  const hmac = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
  return sig === hmac;
}

router.post('/', async (req, res) => {
  if (!verifySignature(req)) return res.status(401).json({ error: 'Invalid signature' });
  const { event, data } = req.body;
  if (event === 'employee.created' || event === 'employee.updated') {
    await prisma.employee.upsert({
      where: { employeeNumber: data.employeeNumber },
      update: { fullName: data.fullName, role: data.role, department: data.department },
      create: { employeeNumber: data.employeeNumber, fullName: data.fullName, role: data.role, department: data.department }
    });
  } else if (event === 'employee.deleted') {
    await prisma.employee.updateMany({ where: { employeeNumber: data.employeeNumber }, data: { role: 'INACTIVE' } });
  }
  res.json({ ok: true });
});

export default router;
