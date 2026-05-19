import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import { runPipeline } from '../agents/orchestrator';
import { ensureDefaultUser, prisma } from '../db/prisma';
import { broadcast, broadcastLog } from '../socket';
import { userFromRequest } from '../utils/supabaseAuth';

const uploadDir = process.platform === 'win32' ? path.join(process.cwd(), 'uploads') : '/tmp/uploads';
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.mp3', '.mp4', '.wav', '.m4a', '.ogg', '.txt', '.vtt', '.webm'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
});

const router = Router();

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const user = await userFromRequest(req as any) ?? await ensureDefaultUser();
    const attendees = safeJson(req.body.attendees, []);
    const meeting = await prisma.meeting.create({
      data: {
        userId: user.id,
        title: req.body.title || req.file.originalname.replace(/\.[^.]+$/, ''),
        startTime: new Date(),
        attendees,
        status: 'PENDING',
      },
    });

    const ext = path.extname(req.file.originalname);
    const finalPath = path.join(uploadDir, `${meeting.id}${ext}`);
    fs.renameSync(req.file.path, finalPath);
    await prisma.meeting.update({ where: { id: meeting.id }, data: { uploadedFilePath: finalPath } });

    broadcast({ type: 'meeting:created', data: { meetingId: meeting.id, title: meeting.title } });
    broadcastLog('orchestrator', `File uploaded: ${req.file.originalname} — pipeline starting`);
    runPipeline(meeting.id).catch(console.error);
    return res.json({ success: true, meetingId: meeting.id, message: 'Pipeline started' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

function safeJson(value: string | undefined, fallback: unknown) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export default router;
