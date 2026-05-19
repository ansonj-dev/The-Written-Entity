import { prisma } from '../db/prisma';
import { draftEmailWithGemini } from '../integrations/gemini';
import { sendGmailMessage } from '../integrations/google/gmail';
import { AnalysisResult } from '../types';
import { broadcast, broadcastLog } from '../socket';

export async function runCommsAgent(meetingId: string, analysis: AnalysisResult) {
  const meeting = await prisma.meeting.findUniqueOrThrow({ where: { id: meetingId } });
  const emails = [];
  const followUps = analysis.followUps.length ? analysis.followUps : followUpsFromActions(analysis);

  for (const followUp of followUps) {
    const draft = await draftSafely({
      meetingTitle: meeting.title,
      summary: analysis.summary,
      topic: followUp.topic,
      recipientName: followUp.recipientName,
    }) ?? localDraft(meeting.title, analysis.summary, followUp.topic, followUp.recipientName);

    const gmailId = await sendGmailMessage(meeting.userId, {
      to: followUp.recipientEmail,
      subject: draft.subject,
      html: draft.html,
      text: draft.text,
    });

    const email = await prisma.email.create({
      data: {
        meetingId,
        toEmail: followUp.recipientEmail,
        toName: followUp.recipientName,
        subject: draft.subject,
        bodyText: draft.text,
        bodyHtml: draft.html,
        gmailMessageId: gmailId,
        sentAt: gmailId ? new Date() : null,
        status: gmailId ? 'SENT' : 'DRAFT',
      },
    });
    emails.push(email);
    if (gmailId) broadcast({ type: 'email:sent', data: { meetingId, emailId: email.id, toEmail: email.toEmail } });
    broadcastLog('commsAgent', `${gmailId ? 'Sent' : 'Drafted'} follow-up for ${email.toEmail}`);
  }

  return emails;
}

function followUpsFromActions(analysis: AnalysisResult) {
  return analysis.actionItems
    .filter(item => item.ownerEmail)
    .map(item => ({
      recipientEmail: item.ownerEmail!,
      recipientName: item.ownerName,
      topic: item.title,
      urgency: item.priority,
      requiresCalendarEvent: false,
    }));
}

async function draftSafely(input: { meetingTitle: string; summary: string; topic: string; recipientName: string | null }) {
  try {
    return await draftEmailWithGemini(input);
  } catch (err) {
    console.warn('Gemini email draft failed, using local fallback:', err);
    return null;
  }
}

function localDraft(meetingTitle: string, summary: string, topic: string, recipientName: string | null) {
  const name = recipientName ?? 'there';
  const text = `Hi ${name},\n\nFollowing up on ${meetingTitle}: ${topic}.\n\n${summary}\n\nThanks.`;
  return {
    subject: `Follow-up: ${topic}`,
    text,
    html: `<p>Hi ${name},</p><p>Following up on <strong>${meetingTitle}</strong>: ${topic}.</p><p>${summary}</p><p>Thanks.</p>`,
  };
}
