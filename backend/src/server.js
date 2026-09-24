import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import leavesRouter from './routes/leaves.js';
import hrmsWebhook from './routes/webhooks/hrms.js';
import reportsRouter from './routes/reports.js';
import settingsRouter from './routes/settings.js';

dotenv.config();

import { audit } from './middleware/audit.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(audit);

app.get('/health', (req, res) => res.json({ ok: true, service: 'lgu-leave' }));

app.use('/auth', authRouter);
app.use('/api/v1/leaves', leavesRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1/webhooks/hrms', hrmsWebhook);

const PORT = process.env.PORT || 4200;
app.listen(PORT, () => console.log(`Leave API listening on ${PORT}`));
