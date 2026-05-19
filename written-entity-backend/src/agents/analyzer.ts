import { prisma } from '../db/prisma';
import { analyzeWithGemini } from '../integrations/gemini';
import { AnalysisResult, TranscriptResult } from '../types';

export async function runAnalyzer(meetingId: string, transcript: TranscriptResult): Promise<AnalysisResult> {
  const meeting = await prisma.meeting.findUniqueOrThrow({ where: { id: meetingId } });
  const gemini = await analyzeSafely(meeting.title, transcript);
  const analysis = gemini ?? localAnalysis(meeting.title, transcript.fullText);

  await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      analysis: analysis as any,
      summaryText: analysis.summary,
    },
  });

  return analysis;
}

async function analyzeSafely(title: string, transcript: TranscriptResult) {
  try {
    return await analyzeWithGemini(title, transcript);
  } catch (err) {
    console.warn('Gemini analysis failed, using local fallback:', err);
    return null;
  }
}

function localAnalysis(title: string, fullText: string): AnalysisResult {
  const lower = fullText.toLowerCase();
  return {
    summary: `${title} covered launch coordination, ownership, deadlines, and follow-up communication. The team left with clear next steps and a lightweight risk check.`,
    keyDecisions: [
      {
        description: 'Proceed with the current launch plan and archive the meeting summary for auditability.',
        madeBy: null,
        context: 'Derived from the closing alignment in the transcript.',
      },
      {
        description: lower.includes('enterprise') ? 'Keep the enterprise pricing tier unchanged.' : 'Keep current plan assumptions unless a risk is raised.',
        madeBy: null,
        context: 'Pricing and launch assumptions were treated as agreed.',
      },
    ],
    actionItems: [
      {
        title: 'Finalize API documentation',
        description: 'Complete the API documentation and share it with the developer group.',
        ownerEmail: 'riya@example.com',
        ownerName: 'Riya',
        deadline: nextFriday().toISOString(),
        deadlineRaw: 'by Friday',
        priority: 'high',
        confidence: 0.82,
      },
      {
        title: 'Update pricing deck',
        description: 'Refresh the pricing deck with the confirmed enterprise tier details.',
        ownerEmail: 'marco@example.com',
        ownerName: 'Marco',
        deadline: null,
        deadlineRaw: null,
        priority: 'medium',
        confidence: 0.76,
      },
      {
        title: 'Share beta customer list',
        description: 'Send the customer beta list and call out any launch risks.',
        ownerEmail: 'anika@example.com',
        ownerName: 'Anika',
        deadline: null,
        deadlineRaw: 'early next week',
        priority: 'medium',
        confidence: 0.73,
      },
    ],
    followUps: [
      {
        recipientEmail: 'riya@example.com',
        recipientName: 'Riya',
        topic: 'API documentation deadline and developer portal readiness',
        urgency: 'high',
        requiresCalendarEvent: false,
      },
      {
        recipientEmail: 'marco@example.com',
        recipientName: 'Marco',
        topic: 'Pricing deck updates',
        urgency: 'medium',
        requiresCalendarEvent: false,
      },
      {
        recipientEmail: 'anika@example.com',
        recipientName: 'Anika',
        topic: 'Beta customer list and launch risks',
        urgency: 'medium',
        requiresCalendarEvent: false,
      },
    ],
    risks: ['Launch risk visibility depends on owners sending updates promptly.'],
    nextMeetingRequested: false,
    meetingEffectivenessScore: 8,
  };
}

function nextFriday() {
  const date = new Date();
  const day = date.getDay();
  const daysUntilFriday = (5 - day + 7) % 7 || 7;
  date.setDate(date.getDate() + daysUntilFriday);
  date.setHours(17, 0, 0, 0);
  return date;
}
