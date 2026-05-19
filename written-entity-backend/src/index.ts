import 'dotenv/config';
import fs from 'fs';
import http from 'http';
import path from 'path';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import authRoutes from './routes/auth';
import meetingRoutes from './routes/meetings';
import pipelineRoutes from './routes/pipeline';
import uploadRoutes from './routes/upload';
import webhookRoutes from './routes/webhook';
import { ensureDefaultUser } from './db/prisma';
import { initWebSocket } from './socket';

const app = express();
const server = http.createServer(app);
const port = Number(process.env.PORT ?? 3001);
const frontendUrl = process.env.FRONTEND_URL ?? '*';

initWebSocket(server);

app.use(cors({ origin: frontendUrl === '*' ? true : frontendUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'local-development-only-change-before-auth',
  resave: false,
  saveUninitialized: false,
}));

app.use('/webhook', webhookRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/auth', authRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const uploadDir = process.platform === 'win32' ? path.join(process.cwd(), 'uploads') : '/tmp/uploads';
fs.mkdirSync(uploadDir, { recursive: true });

ensureDefaultUser()
  .then(() => {
    server.listen(port, () => {
      console.log(`The Written Entity backend running on http://localhost:${port}`);
      console.log(`WebSocket available at ws://localhost:${port}/ws`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize backend:', err);
    process.exit(1);
  });
