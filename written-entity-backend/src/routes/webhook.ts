import { Router } from 'express';
import { runPipeline } from '../agents/orchestrator';
import { ensureDefaultUser, prisma } from '../db/prisma';
import { getRecentlyEndedEvents, registerCalendarWebhook } from '../integrations/google/calendar';
import { broadcast, broadcastLog } from '../socket';

const router = Router();

router.post('/google/calendar', async (req, res) => {
  res.status(200).send('OK');

  try {
    const channelId = req.headers['x-goog-channel-id'] as string;
    const resourceState = req.headers['x-goog-resource-state'] as string;
    if (resourceState && resourceState !== 'exists') return;

    const channel = await prisma.calendarWebhookChannel.findUnique({ where: { channelId } });
    if (!channel) return;

    const events = await getRecentlyEndedEvents(channel.userId, new Date(Date.now() - 10 * 60 * 1000), new Date());
    for (const event of events as any[]) {
      if (!event.id) continue;
      const existing = await prisma.meeting.findUnique({ where: { googleEventId: event.id } });
      if (existing) continue;
      const meeting = await prisma.meeting.create({
        data: {
          userId: channel.userId,
          googleEventId: event.id,
          title: event.summary || 'Untitled Meeting',
          startTime: new Date(event.start?.dateTime ?? Date.now()),
          endTime: event.end?.dateTime ? new Date(event.end.dateTime) : null,
          attendees: event.attendees ?? [],
          meetingLink: event.hangoutLink ?? null,
        },
      });
      broadcast({ type: 'meeting:created', data: { meetingId: meeting.id, title: meeting.title } });
      runPipeline(meeting.id).catch(console.error);
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
  }
});

router.post('/register/:userId?', async (req, res) => {
  try {
    const user = req.params.userId ? await prisma.user.findUnique({ where: { id: req.params.userId } }) : await ensureDefaultUser();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const channelId = `written-entity-${user.id}-${Date.now()}`;
    const channel = await registerCalendarWebhook(user.id, channelId);
    await prisma.calendarWebhookChannel.create({
      data: {
        userId: user.id,
        channelId,
        resourceId: channel.resourceId,
        expiry: new Date(Number(channel.expiration)),
      },
    });
    broadcastLog('orchestrator', `Calendar webhook registered for ${user.email}`);
    return res.json({ success: true, channelId, expiry: channel.expiration });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
