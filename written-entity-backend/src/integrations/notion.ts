import { Client } from '@notionhq/client';
import { ActionItem } from '../types';

export async function createNotionTask(task: ActionItem, meetingTitle: string) {
  if (!process.env.NOTION_DATABASE_ID || !process.env.NOTION_CLIENT_SECRET || process.env.NOTION_CLIENT_SECRET.startsWith('your_')) {
    return null;
  }

  const notion = new Client({ auth: process.env.NOTION_CLIENT_SECRET });
  const page = await notion.pages.create({
    parent: { database_id: process.env.NOTION_DATABASE_ID },
    properties: {
      Name: { title: [{ text: { content: task.title } }] },
      Description: { rich_text: [{ text: { content: task.description } }] },
      Assignee: { rich_text: [{ text: { content: task.ownerName ?? task.ownerEmail ?? 'Unassigned' } }] },
      Priority: { select: { name: task.priority } },
      Meeting: { rich_text: [{ text: { content: meetingTitle } }] },
      ...(task.deadline ? { 'Due Date': { date: { start: task.deadline } } } : {}),
    },
  });

  return {
    pageId: page.id,
    url: 'url' in page ? page.url : null,
  };
}
