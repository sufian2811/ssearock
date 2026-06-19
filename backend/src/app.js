import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { authMiddleware } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import leadsRouter from './routes/leads.js';
import messagesRouter from './routes/messages.js';
import webhookRouter from './routes/webhook.js';

const app = express();

const allowedOrigins = [
  config.frontendUrl,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/leads', authMiddleware, leadsRouter);
app.use('/api/messages', authMiddleware, messagesRouter);

export default app;
