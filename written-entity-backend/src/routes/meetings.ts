import { Router } from 'express';
import { prisma, ensureDefaultUser } from '../db/prisma';

const router = Router();

router.get('/', async (_req, res) => {
  const meetings = await prisma.meeting.findMany({ orderBy: { startTime: 'desc' }, take: 50 });
  return res.json(meetings);
});

router.post('/', async (req, res) => {
  const user = await ensureDefaultUser();
  const meeting = await prisma.meeting.create({
    data: {
      userId: user.id,
      title: req.body.title ?? 'Untitled Meeting',
      startTime: req.body.startTime ? new Date(req.body.startTime) : new Date(),
      endTime: req.body.endTime ? new Date(req.body.endTime) : null,
      attendees: req.body.attendees ?? [],
      meetingLink: req.body.meetingLink ?? null,
    },
  });
  return res.status(201).json(meeting);
});

export default router;
