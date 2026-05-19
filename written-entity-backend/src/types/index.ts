export interface TranscriptSegment {
  speaker: string;
  speakerIndex: number;
  text: string;
  startMs: number;
  endMs: number;
}

export interface TranscriptResult {
  segments: TranscriptSegment[];
  fullText: string;
  durationMs: number;
  speakerCount: number;
  wordCount: number;
}

export interface ActionItem {
  title: string;
  description: string;
  ownerEmail: string | null;
  ownerName: string | null;
  deadline: string | null;
  deadlineRaw: string | null;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
}

export interface Decision {
  description: string;
  madeBy: string | null;
  context: string;
}

export interface FollowUp {
  recipientEmail: string;
  recipientName: string | null;
  topic: string;
  urgency: 'high' | 'medium' | 'low';
  requiresCalendarEvent: boolean;
  suggestedEventTitle?: string;
}

export interface AnalysisResult {
  summary: string;
  keyDecisions: Decision[];
  actionItems: ActionItem[];
  followUps: FollowUp[];
  risks: string[];
  nextMeetingRequested: boolean;
  meetingEffectivenessScore: number;
}

export interface StepState {
  agentName: string;
  status: 'pending' | 'running' | 'done' | 'failed' | 'retrying';
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  errorMessage?: string;
  retryCount: number;
}

export interface PipelineState {
  meetingId: string;
  runId: string;
  status: 'running' | 'done' | 'failed' | 'partial';
  currentAgent: string;
  steps: StepState[];
  progressPercent: number;
  startedAt: string;
  completedAt?: string;
}

export type WSMessage =
  | { type: 'connected'; data: { clientCount: number } }
  | { type: 'pipeline:step:update'; data: StepState & { meetingId: string; progressPercent?: number } }
  | { type: 'pipeline:complete'; data: PipelineState }
  | { type: 'pipeline:failed'; data: { meetingId: string; error: string } }
  | { type: 'pipeline:log'; data: { timestamp: string; agent: string; message: string; level: 'info' | 'warn' | 'error' } }
  | { type: 'meeting:created'; data: { meetingId: string; title: string } }
  | { type: 'task:created'; data: { meetingId: string; taskId: string; title: string; notionUrl: string | null } }
  | { type: 'email:sent'; data: { meetingId: string; emailId: string; toEmail: string } };
