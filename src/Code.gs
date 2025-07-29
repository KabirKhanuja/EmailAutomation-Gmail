// global constants
const DASHBOARD_SHEET_ID = 'enter the sheet id here (i used google sheets for cloud interaction)';
const DASHBOARD_SHEET_NAME = 'EmailDashboard';
const PROCESSED_LABEL = 'AutomationProcessed';


function ensureGmailLabel(labelName) {
  if (!labelName || typeof labelName !== 'string' || labelName.trim() === '') {
    throw new Error('Label name is invalid or empty.');
  }

  const sanitizedLabel = labelName.trim().replace(/[^\w\s-]/g, '');

  let label = GmailApp.getUserLabelByName(sanitizedLabel);
  if (!label) {
    label = GmailApp.createLabel(sanitizedLabel);
  }
  return label;
}

// today's email by date
function getTodayDateQuery() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}


function getGroqSummaryAndImportance(subject, body) {
  const prompt = `
You are an AI assistant that analyzes email content. 
Summarize the email below and rate its importance from 1 to 10, where:
- 1–3 = spam or promotional
- 4–6 = personal, low urgency
- 7–8 = relevant work email or internal communication
- 9–10 = high-priority tasks, deadlines, or meetings

EMAIL SUBJECT: ${subject}
EMAIL BODY: ${body}
`;

  return {
    summary: subject + " (summary here)",
    importanceScore: Math.floor(Math.random() * 10) + 1
  };
}


function storeEmailDataInSheet(emailData) {
  const sheet = SpreadsheetApp.openById(DASHBOARD_SHEET_ID).getSheetByName(DASHBOARD_SHEET_NAME);
  if (!sheet) throw new Error("Sheet not found: " + DASHBOARD_SHEET_NAME);

  sheet.clearContents();
  sheet.appendRow(['Date', 'Sender', 'Subject', 'Summary', 'Importance Score', 'Message ID', 'Permalink']);

  emailData.forEach(entry => {
    sheet.appendRow([
      entry.date,
      entry.sender,
      entry.subject,
      entry.summary,
      entry.importanceScore,
      entry.messageId,
      entry.permalink
    ]);
  });
}


function processImportantEmailsForDashboard() {
  const label = ensureGmailLabel(PROCESSED_LABEL);
  const queryDate = getTodayDateQuery();
  const threads = GmailApp.search(`after:${queryDate} -label:${PROCESSED_LABEL}`);
  let importantEmails = [];

  threads.forEach(thread => {
    thread.getMessages().forEach(message => {
      const messageDate = message.getDate();
      const today = new Date();
      const isToday =
        messageDate.getFullYear() === today.getFullYear() &&
        messageDate.getMonth() === today.getMonth() &&
        messageDate.getDate() === today.getDate();

      if (!isToday) return;

      const sender = message.getFrom();
      const subject = message.getSubject();
      const body = message.getPlainBody();
      const messageId = message.getId();
      const permalink = thread.getPermalink();

      try {
        const { summary, importanceScore } = getGroqSummaryAndImportance(subject, body);

        importantEmails.push({
          date: messageDate.toLocaleString(),
          sender,
          subject,
          summary,
          importanceScore,
          messageId,
          permalink
        });

        thread.addLabel(label);
      } catch (e) {
        Logger.log("Failed to process message: " + e.message);
      }
    });
  });

  importantEmails.sort((a, b) => b.importanceScore - a.importanceScore);
  storeEmailDataInSheet(importantEmails.slice(0, 25));
}

