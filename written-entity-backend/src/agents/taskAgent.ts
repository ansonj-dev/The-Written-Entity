import { prisma } from '../db/prisma';
import { createNotionTask } from '../integrations/notion';
import { AnalysisResult } from '../types';
import { parseDate } from '../utils/dateParser';
import { broadcast, broadcastLog } from '../socket';

export async function runTaskAgent(meetingId: string, analysis: AnalysisResult) {
  const meeting = await prisma.meeting.findUniqueOrThrow({ where: { id: meetingId } });
  const created = [];

  for (const item of analysis.actionItems) {
    const notion = await createNotionTaskSafely(item, meeting.title);
    const task = await prisma.task.create({
      data: {
        meetingId,
        title: item.title,
        description: item.description,
        ownerEmail: item.ownerEmail,
        ownerName: item.ownerName,
        deadline: parseDate(item.deadline),
        priority: item.priority,
        notionPageId: notion?.pageId,
        notionUrl: notion?.url,
      },
    });
    created.push(task);
    broadcast({ type: 'task:created', data: { meetingId, taskId: task.id, title: task.title, notionUrl: task.notionUrl } });
    broadcastLog('taskAgent', `Created task: ${task.title}${task.notionUrl ? ' in Notion' : ' locally'}`);
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  return created;
}

async function createNotionTaskSafely(item: AnalysisResult['actionItems'][number], meetingTitle: string) {
  try {
    return await createNotionTask(item, meetingTitle);
  } catch (err) {
    console.warn('Notion task creation failed, storing task locally:', err);
    return null;
  }
}
