import fs from 'fs/promises';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalysisResult, TranscriptResult } from '../types';

export async function transcribeWithGemini(filePath: string): Promise<TranscriptResult | null> {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.startsWith('your_')) return null;

  const ext = path.extname(filePath).toLowerCase();
  if (['.txt', '.vtt'].includes(ext)) {
    const fullText = await fs.readFile(filePath, 'utf8');
    return transcriptFromText(fullText);
  }

  const data = await fs.readFile(filePath);
  const mimeType = mimeFromExt(ext);
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: geminiModelName() });
  const result = await model.generateContent([
    { text: 'Transcribe this meeting audio with speaker labels. Return plain transcript text.' },
    { inlineData: { data: data.toString('base64'), mimeType } },
  ]);
  return transcriptFromText(result.response.text());
}

export function transcriptFromText(fullText: string): TranscriptResult {
  const clean = fullText.trim() || 'No transcript content was provided.';
  const chunks = clean.split(/\n{2,}/).filter(Boolean);
  const segments = (chunks.length ? chunks : [clean]).map((text, index) => ({
    speaker: `Speaker ${index % 2 + 1}`,
    speakerIndex: index % 2,
    text: text.replace(/^\s*[^:]{1,40}:\s*/, '').trim(),
    startMs: index * 30000,
    endMs: (index + 1) * 30000,
  }));

  return {
    segments,
    fullText: clean,
    durationMs: Math.max(segments.length * 30000, 30000),
    speakerCount: Math.min(2, segments.length),
    wordCount: clean.split(/\s+/).filter(Boolean).length,
  };
}

export async function analyzeWithGemini(title: string, transcript: TranscriptResult): Promise<AnalysisResult | null> {
  const model = getGeminiModel();
  if (!model) return null;

  const result = await model.generateContent([
    `Analyze this meeting transcript and respond only with valid JSON matching this TypeScript shape:
{
  "summary": "string",
  "keyDecisions": [{ "description": "string", "madeBy": "string|null", "context": "string" }],
  "actionItems": [{
    "title": "string",
    "description": "string",
    "ownerEmail": "string|null",
    "ownerName": "string|null",
    "deadline": "ISO date string|null",
    "deadlineRaw": "string|null",
    "priority": "high|medium|low",
    "confidence": 0.0
  }],
  "followUps": [{
    "recipientEmail": "string",
    "recipientName": "string|null",
    "topic": "string",
    "urgency": "high|medium|low",
    "requiresCalendarEvent": false
  }],
  "risks": ["string"],
  "nextMeetingRequested": false,
  "meetingEffectivenessScore": 8
}

Use null when owner emails are unknown. Do not include markdown fences.

Meeting title: ${title}

Transcript:
${transcript.fullText}`,
  ]);

  return parseGeminiJson<AnalysisResult>(result.response.text());
}

export async function draftEmailWithGemini(input: {
  meetingTitle: string;
  summary: string;
  topic: string;
  recipientName: string | null;
}) {
  const model = getGeminiModel();
  if (!model) return null;

  const result = await model.generateContent([
    `Write a concise professional follow-up email after a meeting.
Respond only with valid JSON: { "subject": "...", "text": "...", "html": "..." }
Keep it under 150 words.

Meeting: ${input.meetingTitle}
Recipient: ${input.recipientName ?? 'there'}
Topic: ${input.topic}
Summary: ${input.summary}`,
  ]);

  return parseGeminiJson<{ subject: string; text: string; html: string }>(result.response.text());
}

function getGeminiModel() {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.startsWith('your_')) return null;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: geminiModelName() });
}

function geminiModelName() {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

function parseGeminiJson<T>(text: string): T {
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean) as T;
}

function mimeFromExt(ext: string) {
  return {
    '.mp3': 'audio/mpeg',
    '.mp4': 'audio/mp4',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.ogg': 'audio/ogg',
    '.webm': 'audio/webm',
  }[ext] ?? 'audio/mpeg';
}
