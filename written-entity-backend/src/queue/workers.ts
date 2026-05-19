import { runPipeline } from '../agents/orchestrator';
import { pipelineQueue } from './index';

export function startWorkers() {
  pipelineQueue.process(async (job) => runPipeline(job.data.meetingId));
}
