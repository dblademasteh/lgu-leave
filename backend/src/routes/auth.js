import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev';

const loginSchema = z.object({
  employeeNumber: z.string(),
  password: z.string()
});

const router = Router();

router.post('/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid input' });
  const { employeeNumber, password } = parse.data;
  const user = await prisma.employee.findUnique({ where: { employeeNumber } });
  if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const access = jwt.sign({ sub: user.id, employeeNumber: user.employeeNumber, role: user.role, name: user.fullName }, JWT_SECRET, { expiresIn: '15m' });
  const refresh = jwt.sign({ sub: user.id, typ: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
  await prisma.employee.update({ where: { id: user.id }, data: { refreshToken: refresh } });

  res.json({ accessToken: access, refreshToken: refresh, user: { id: user.id, employeeNumber: user.employeeNumber, fullName: user.fullName, role: user.role, department: user.department }});
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(refreshToken, JWT_SECRET);
    if (payload.typ !== 'refresh') throw new Error('bad');
    const user = await prisma.employee.findUnique({ where: { id: payload.sub } });
    if (!user || user.refreshToken !== refreshToken) return res.status(401).json({ error: 'Invalid refresh' });
    const access = jwt.sign({ sub: user.id, employeeNumber: user.employeeNumber, role: user.role, name: user.fullName }, JWT_SECRET, { expiresIn: '15m' });
    res.json({ accessToken: access });
  } catch {
    res.status(401).json({ error: 'Invalid refresh' });
  }
});

router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body || {};
  if (refreshToken) {
    try {
      const payload = jwt.verify(refreshToken, JWT_SECRET);
      await prisma.employee.update({ where: { id: payload.sub }, data: { refreshToken: null } });
    } catch {}
  }
  res.json({ ok: true });
});

export default router;
