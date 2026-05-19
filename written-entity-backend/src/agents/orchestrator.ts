import { PipelineRun, PipelineStep } from '@prisma/client';
import { prisma } from '../db/prisma';
import { broadcast, broadcastLog } from '../socket';
import { PipelineState } from '../types';
import { withRetry } from '../utils/retry';
import { runAnalyzer } from './analyzer';
import { runArchiver } from './archiver';
import { runCommsAgent } from './commsAgent';
import { runTaskAgent } from './taskAgent';
import { runTranscriber } from './transcriber';

const progressMap: Record<string, number> = {
  orchestrator: 10,
  transcriber: 25,
  analyzer: 45,
  taskAgent: 65,
  commsAgent: 85,
  archiver: 100,
};

export async function runPipeline(meetingId: string) {
  const startedAt = Date.now();
  const existing = await prisma.pipelineRun.findUnique({ where: { meetingId } });
  if (existing?.status === 'RUNNING') return existing;
  if (existing) {
    await prisma.pipelineStep.deleteMany({ where: { pipelineRunId: existing.id } });
    await prisma.pipelineRun.delete({ where: { id: existing.id } });
  }

  const run = await prisma.pipelineRun.create({ data: { meetingId, status: 'RUNNING' } });
  const stepNames = ['orchestrator', 'transcriber', 'analyzer', 'taskAgent', 'commsAgent', 'archiver'];
  await prisma.pipelineStep.createMany({
    data: stepNames.map((agentName) => ({ pipelineRunId: run.id, agentName, status: agentName === 'orchestrator' ? 'DONE' : 'PENDING' })),
  });

  broadcastLog('orchestrator', `Pipeline initialized for meeting ${meetingId}`);
  await updateStep(run.id, meetingId, 'orchestrator', 'DONE', { completedAt: new Date(), durationMs: 0 });

  try {
    await updateStep(run.id, meetingId, 'transcriber', 'RUNNING', { startedAt: new Date() });
    broadcastLog('transcriber', 'Preparing transcript...');
    const transcript = await timedStep('transcriber', () => withRetry(() => runTranscriber(meetingId), {
      maxAttempts: 3,
      baseDelayMs: 1000,
      onRetry: (attempt, err) => markRetry(run.id, meetingId, 'transcriber', attempt, err),
    }), run.id, meetingId);
    broadcastLog('transcriber', `Done · ${transcript.wordCount} words · ${transcript.speakerCount} speakers`);

    await updateStep(run.id, meetingId, 'analyzer', 'RUNNING', { startedAt: new Date() });
    broadcastLog('analyzer', 'Reasoning over transcript...');
    const analysis = await timedStep('analyzer', () => withRetry(() => runAnalyzer(meetingId, transcript), {
      maxAttempts: 3,
      baseDelayMs: 1000,
      onRetry: (attempt, err) => markRetry(run.id, meetingId, 'analyzer', attempt, err),
    }), run.id, meetingId);
    broadcastLog('analyzer', `Extracted ${analysis.actionItems.length} actions · ${analysis.keyDecisions.length} decisions · ${analysis.risks.length} risks`);

    await updateStep(run.id, meetingId, 'taskAgent', 'RUNNING', { startedAt: new Date() });
    broadcastLog('taskAgent', `Creating ${analysis.actionItems.length} tasks...`);
    const tasks = await timedStep('taskAgent', () => withRetry(() => runTaskAgent(meetingId, analysis), {
      maxAttempts: 3,
      baseDelayMs: 1500,
      onRetry: (attempt, err) => markRetry(run.id, meetingId, 'taskAgent', attempt, err),
    }), run.id, meetingId);

    await updateStep(run.id, meetingId, 'commsAgent', 'RUNNING', { startedAt: new Date() });
    broadcastLog('commsAgent', `Drafting ${analysis.followUps.length} follow-up emails...`);
    const emails = await timedStep('commsAgent', () => withRetry(() => runCommsAgent(meetingId, analysis), {
      maxAttempts: 3,
      baseDelayMs: 1000,
      onRetry: (attempt, err) => markRetry(run.id, meetingId, 'commsAgent', attempt, err),
    }), run.id, meetingId);

    await updateStep(run.id, meetingId, 'archiver', 'RUNNING', { startedAt: new Date() });
    broadcastLog('archiver', 'Archiving summary...');
    const archive = await timedStep('archiver', () => withRetry(() => runArchiver(meetingId, analysis, tasks, emails), {
      maxAttempts: 2,
      baseDelayMs: 1000,
      onRetry: (attempt, err) => markRetry(run.id, meetingId, 'archiver', attempt, err),
    }), run.id, meetingId);
    broadcastLog('archiver', `Summary archived · ${archive.driveUrl}`);

    const totalMs = Date.now() - startedAt;
    const completed = await prisma.pipelineRun.update({
      where: { id: run.id },
      data: { status: 'DONE', completedAt: new Date(), totalMs },
      include: { steps: true },
    });
    await prisma.meeting.update({ where: { id: meetingId }, data: { status: 'DONE' } });
    broadcast({ type: 'pipeline:complete', data: toPipelineState(meetingId, completed) });
    broadcastLog('orchestrator', `Pipeline complete · ${(totalMs / 1000).toFixed(1)}s total`);
    return completed;
  } catch (err: any) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.pipelineRun.update({ where: { id: run.id }, data: { status: 'FAILED', completedAt: new Date() } });
    await prisma.meeting.update({ where: { id: meetingId }, data: { status: 'FAILED' } });
    broadcastLog('orchestrator', message, 'error');
    broadcast({ type: 'pipeline:failed', data: { meetingId, error: message } });
    throw err;
  }
}

async function timedStep<T>(agentName: string, fn: () => Promise<T>, runId: string, meetingId: string): Promise<T> {
  const start = Date.now();
  try {
    const output = await fn();
    await updateStep(runId, meetingId, agentName, 'DONE', { completedAt: new Date(), durationMs: Date.now() - start, output: output as any });
    return output;
  } catch (err: any) {
    await updateStep(runId, meetingId, agentName, 'FAILED', {
      completedAt: new Date(),
      durationMs: Date.now() - start,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

async function markRetry(runId: string, meetingId: string, agentName: string, attempt: number, err: Error) {
  await updateStep(runId, meetingId, agentName, 'RETRYING', { retryCount: attempt, errorMessage: err.message });
  broadcastLog(agentName, `Attempt ${attempt} failed: ${err.message}. Retrying...`, 'warn');
}

async function updateStep(runId: string, meetingId: string, agentName: string, status: any, extra: Record<string, any> = {}) {
  await prisma.pipelineStep.updateMany({
    where: { pipelineRunId: runId, agentName },
    data: { status, ...extra },
  });

  const meetingStatus = {
    transcriber: 'TRANSCRIBING',
    analyzer: 'ANALYZING',
    taskAgent: 'CREATING_TASKS',
    commsAgent: 'SENDING_COMMS',
    archiver: 'ARCHIVING',
  }[agentName] as any;
  if (status === 'RUNNING' && meetingStatus) await prisma.meeting.update({ where: { id: meetingId }, data: { status: meetingStatus } });

  broadcast({
    type: 'pipeline:step:update',
    data: {
      meetingId,
      agentName,
      status: status.toLowerCase(),
      retryCount: extra.retryCount ?? 0,
      durationMs: extra.durationMs,
      errorMessage: extra.errorMessage,
      startedAt: extra.startedAt?.toISOString?.(),
      completedAt: extra.completedAt?.toISOString?.(),
      progressPercent: progressMap[agentName],
    },
  });
}

function toPipelineState(meetingId: string, run: PipelineRun & { steps: PipelineStep[] }): PipelineState {
  const doneSteps = run.steps.filter((step) => step.status === 'DONE');
  const current = run.steps.find((step) => step.status === 'RUNNING')?.agentName ?? doneSteps.at(-1)?.agentName ?? 'orchestrator';
  return {
    meetingId,
    runId: run.id,
    status: run.status.toLowerCase() as PipelineState['status'],
    currentAgent: current,
    progressPercent: progressMap[current] ?? 0,
    startedAt: run.startedAt.toISOString(),
    completedAt: run.completedAt?.toISOString(),
    steps: run.steps.map((step) => ({
      agentName: step.agentName,
      status: step.status.toLowerCase() as any,
      startedAt: step.startedAt?.toISOString(),
      completedAt: step.completedAt?.toISOString(),
      durationMs: step.durationMs ?? undefined,
      errorMessage: step.errorMessage ?? undefined,
      retryCount: step.retryCount,
    })),
  };
}
