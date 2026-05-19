import { google } from 'googleapis';
import { prisma } from '../../db/prisma';

export async function sendGmailMessage(userId: string, options: { to: string; subject: string; html: string; text: string }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.googleAccessToken) return null;

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: user.googleAccessToken });
  const gmail = google.gmail({ version: 'v1', auth });
  const email = [
    `To: ${options.to}`,
    `Subject: ${options.subject}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    options.html || options.text,
  ].join('\n');

  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: Buffer.from(email).toString('base64url') },
  });

  return result.data.id ?? null;
}
