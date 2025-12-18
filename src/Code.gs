//config 
const DASHBOARD_SHEET_ID = '1XFCGbCVgpSpkjXl_sUdLnK_K4B9HsB-74lxeii5qWQo'; // this is my sheet id, you can replace it with yours
const DASHBOARD_SHEET_NAME = 'EmailDashboard'; // name of my sheet
const PROCESSED_LABEL = 'AutomationProcessed'; // this is the label which you'll have in your mails 

//utils 
function ensureGmailLabel(labelName) {
  let label = GmailApp.getUserLabelByName(labelName);
  if (!label) {
    label = GmailApp.createLabel(labelName);
  }
  return label;
}

// everything related to the sheet and operations 
function storeEmailDataInSheet(emailData) {
  const sheet = SpreadsheetApp
    .openById(DASHBOARD_SHEET_ID)
    .getSheetByName(DASHBOARD_SHEET_NAME);

  if (!sheet) {
    throw new Error('Sheet not found: ' + DASHBOARD_SHEET_NAME);
  }

  sheet.clearContents();
  sheet.appendRow([
    'Date',
    'Sender',
    'Subject',
    'Summary',
    'Importance Score',
    'Message ID',
    'Permalink'
  ]);

  emailData.forEach(e => {
    sheet.appendRow([
      e.date,
      e.sender,
      e.subject,
      e.summary,
      e.importanceScore,
      e.messageId,
      e.permalink
    ]);
  });
}

// core logic 
function processImportantEmailsForDashboard() {
  Logger.log('=== Processing started ===');

  const label = ensureGmailLabel(PROCESSED_LABEL);

  // IMPORTANT: do NOT use after: — it breaks silently
  const threads = GmailApp.search(`in:inbox -label:${PROCESSED_LABEL}`);
  Logger.log(`Threads found: ${threads.length}`);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let collected = [];

  threads.forEach(thread => {
    thread.getMessages().forEach(message => {
      const msgDate = message.getDate();
      msgDate.setHours(0, 0, 0, 0);

      if (msgDate.getTime() !== today.getTime()) return;

      try {
        const subject = message.getSubject();
        const body = message.getPlainBody();

        Logger.log(`Processing email: ${subject}`);

        const { summary, importanceScore } =
          getGroqSummaryAndImportance(subject, body);

        collected.push({
          date: message.getDate().toLocaleString(),
          sender: message.getFrom(),
          subject,
          summary,
          importanceScore,
          messageId: message.getId(),
          permalink: thread.getPermalink()
        });

        thread.addLabel(label);
      } catch (err) {
        Logger.log('Email failed: ' + err.message);
      }
    });
  });

  collected.sort((a, b) => b.importanceScore - a.importanceScore);

  Logger.log(`Total emails collected: ${collected.length}`);

  storeEmailDataInSheet(collected.slice(0, 25));
}

// for web/index.html to fetch the data
function doGet() {
  const sheet = SpreadsheetApp
    .openById(DASHBOARD_SHEET_ID)
    .getSheetByName(DASHBOARD_SHEET_NAME);

  if (!sheet) {
    return ContentService.createTextOutput('[]')
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  }

  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) {
    return ContentService.createTextOutput('[]')
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  }

  const headers = rows.shift();
  const data = rows.map(r => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = r[i]);
    return obj;
  });

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*');
}

// for web/index.html refresh
function doPost() {
  processImportantEmailsForDashboard();

  return ContentService
    .createTextOutput('Emails refreshed successfully.')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*');
}
