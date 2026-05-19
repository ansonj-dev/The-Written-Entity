import Bull from 'bull';

export const pipelineQueue = new Bull('pipeline', process.env.REDIS_URL ?? 'redis://localhost:6379');
