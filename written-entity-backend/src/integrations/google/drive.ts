import { google } from 'googleapis';
import { prisma } from '../../db/prisma';

export async function archiveToDrive(userId: string, title: string, content: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.googleAccessToken) return null;

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: user.googleAccessToken });
  const drive = google.drive({ version: 'v3', auth });
  const result = await drive.files.create({
    requestBody: {
      name: `${title} summary.md`,
      mimeType: 'text/markdown',
    },
    media: {
      mimeType: 'text/markdown',
      body: content,
    },
    fields: 'id, webViewLink',
  });

  if (result.data.id) {
    await drive.permissions.create({
      fileId: result.data.id,
      requestBody: { role: 'reader', type: 'anyone' },
    });
  }

  return result.data.webViewLink ?? null;
}
