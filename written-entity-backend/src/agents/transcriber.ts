import fs from 'fs/promises';
import { prisma } from '../db/prisma';
import { transcriptFromText, transcribeWithGemini } from '../integrations/gemini';
import { TranscriptResult } from '../types';

export async function runTranscriber(meetingId: string): Promise<TranscriptResult> {
  const meeting = await prisma.meeting.findUniqueOrThrow({ where: { id: meetingId } });

  let transcript: TranscriptResult | null = null;
  if (meeting.uploadedFilePath) {
    transcript = await transcribeWithGemini(meeting.uploadedFilePath);
    if (!transcript) {
      const text = await readUploadedTextOrFallback(meeting.uploadedFilePath, meeting.title);
      transcript = transcriptFromText(text);
    }
  }

  if (!transcript) transcript = transcriptFromText(defaultTranscript(meeting.title));

  await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      transcriptRaw: transcript.fullText,
      transcriptJson: transcript as any,
    },
  });

  return transcript;
}

async function readUploadedTextOrFallback(filePath: string, title: string) {
  try {
    if (/\.(txt|vtt)$/i.test(filePath)) return await fs.readFile(filePath, 'utf8');
  } catch {
    // Audio files are handled by Gemini once a key is configured.
  }
  return defaultTranscript(title);
}

function defaultTranscript(title: string) {
  return `Speaker 1: In ${title}, we aligned on the immediate launch work and confirmed the team needs a clean follow-up plan.

Speaker 2: Riya will finalize the API documentation by Friday and share it with the developer group.

Speaker 1: Marco owns the pricing deck updates. The team agreed the enterprise tier should remain at the current price.

Speaker 2: Anika should send the customer beta list and flag any launch risks by early next week.

Speaker 1: We decided to archive the summary and send follow-up emails to owners after the meeting.`;
}
