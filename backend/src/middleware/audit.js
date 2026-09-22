import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export function audit(req, res, next) {
  const start = Date.now();
  res.on('finish', async () => {
    if (req.method === 'GET') return;
    try {
      await prisma.auditLog.create({
        data: {
          action: `${req.method} ${req.path}`,
          entity: req.baseUrl,
          entityId: req.params.id || null,
          userId: req.user?.sub || null,
          details: { statusCode: res.statusCode, duration: Date.now()-start }
        }
      });
    } catch {}
  });
  next();
}
