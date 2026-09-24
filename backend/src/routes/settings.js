import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

router.use(requireAuth);

router.get('/system', async (req, res) => {
  const settings = await prisma.systemSetting.findMany();
  res.json(Object.fromEntries(settings.map(s => [s.key, s.value])));
});

router.patch('/system', async (req, res) => {
  const updates = req.body || {};
  for (const [k, v] of Object.entries(updates)) {
    await prisma.systemSetting.upsert({ where: { key: k }, update: { value: String(v) }, create: { key: k, value: String(v) } });
  }
  res.json({ ok: true });
});

router.get('/leave-rules', async (req, res) => {
  const rules = await prisma.leaveRule.findMany();
  res.json(rules);
});

router.put('/leave-rules/:code', async (req, res) => {
  const { code } = req.params;
  const data = req.body;
  const rule = await prisma.leaveRule.upsert({
    where: { leaveTypeCode: code },
    update: data,
    create: { leaveTypeCode: code, ...data }
  });
  res.json(rule);
});

router.get('/office-hours', async (req, res) => {
  const hours = await prisma.officeHours.findMany({ orderBy: { dayOfWeek: 'asc' } });
  res.json(hours);
});

router.put('/office-hours', async (req, res) => {
  const items = req.body || [];
  for (const item of items) {
    await prisma.officeHours.upsert({
      where: { dayOfWeek: item.dayOfWeek },
      update: item,
      create: item
    });
  }
  res.json({ ok: true });
});

router.get('/holidays', async (req, res) => {
  const holidays = await prisma.holiday.findMany({ orderBy: { date: 'asc' } });
  res.json(holidays);
});

router.post('/holidays', async (req, res) => {
  const { date, name } = req.body;
  const h = await prisma.holiday.create({ data: { date: new Date(date), name } });
  res.json(h);
});

router.delete('/holidays/:id', async (req, res) => {
  await prisma.holiday.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
