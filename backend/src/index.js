import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { authMiddleware } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import leadsRouter from './routes/leads.js';
import messagesRouter from './routes/messages.js';
import webhookRouter from './routes/webhook.js';

const app = express();

app.use(cors({ origin: config.frontendUrl }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/webhook', webhookRouter);

app.use('/api/leads', authMiddleware, leadsRouter);
app.use('/api/messages', authMiddleware, messagesRouter);

app.listen(config.port, () => {
  console.log(`CRM Backend running on http://localhost:${config.port}`);
});
