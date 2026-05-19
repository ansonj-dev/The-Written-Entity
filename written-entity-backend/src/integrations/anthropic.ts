import Anthropic from '@anthropic-ai/sdk';
import { AnalysisResult, TranscriptResult } from '../types';

export async function analyzeWithClaude(title: string, transcript: TranscriptResult): Promise<AnalysisResult | null> {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.startsWith('your_')) return null;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: 'Extract meeting summary, decisions, action items, follow-ups, risks, nextMeetingRequested, and meetingEffectivenessScore. Respond only with valid JSON.',
    messages: [{
      role: 'user',
      content: `Meeting title: ${title}\n\nTranscript:\n${transcript.fullText}`,
    }],
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
  return JSON.parse(text.replace(/```json|```/g, '').trim()) as AnalysisResult;
}

export async function draftEmailWithClaude(input: {
  meetingTitle: string;
  summary: string;
  topic: string;
  recipientName: string | null;
}) {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.startsWith('your_')) return null;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 700,
    system: 'Write a concise professional follow-up email. Respond only with JSON: {"subject":"","text":"","html":""}.',
    messages: [{
      role: 'user',
      content: `Meeting: ${input.meetingTitle}\nRecipient: ${input.recipientName ?? 'there'}\nTopic: ${input.topic}\nSummary: ${input.summary}`,
    }],
  });
  const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
  return JSON.parse(text.replace(/```json|```/g, '').trim()) as { subject: string; text: string; html: string };
}
