import { prisma } from '../../db/prisma';
import { google } from 'googleapis';

export async function getRecentlyEndedEvents(userId: string, from: Date, to: Date) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.googleAccessToken) return [];

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: user.googleAccessToken });
  const calendar = google.calendar({ version: 'v3', auth });
  const result = await calendar.events.list({
    calendarId: 'primary',
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return result.data.items ?? [];
}

export async function registerCalendarWebhook(userId: string, channelId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return {
    id: channelId,
    resourceId: `local-resource-${user.id}`,
    expiration: String(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
}
