import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../db/prisma';
import { archiveToDrive } from '../integrations/google/drive';
import { AnalysisResult } from '../types';

export async function runArchiver(meetingId: string, analysis: AnalysisResult, tasks: Array<{ title: string }>, emails: Array<{ toEmail: string }>) {
  const meeting = await prisma.meeting.findUniqueOrThrow({ where: { id: meetingId } });
  const content = [
    `# ${meeting.title}`,
    '',
    analysis.summary,
    '',
    '## Action Items',
    ...tasks.map((task) => `- ${task.title}`),
    '',
    '## Follow-up Emails',
    ...emails.map((email) => `- ${email.toEmail}`),
  ].join('\n');

  const driveUrl = await archiveToDrive(meeting.userId, meeting.title, content);
  const localDir = path.join(process.cwd(), 'archives');
  await fs.mkdir(localDir, { recursive: true });
  const localPath = path.join(localDir, `${meetingId}.md`);
  await fs.writeFile(localPath, content, 'utf8');
  const summaryDocUrl = driveUrl ?? localPath;

  await prisma.meeting.update({
    where: { id: meetingId },
    data: { summaryDocUrl },
  });

  return { driveUrl: summaryDocUrl };
}
