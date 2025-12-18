const GROQ_API_KEY = 'YOUR_API_KEY';

function getGroqSummaryAndImportance(subject, body) {
  const truncatedBody = body.substring(0, 2000);

  const prompt = `Summarize the following email concisely (1-2 sentences) and provide an importance score from 1 (least important) to 10 (most important). 

  Given the following email body, return a JSON containing:
1. A short summary of the content.
2. An importance score from 1 to 10:
   - 1–3: spam, newsletters, ads.
   - 4–5: general updates, notifications.
   - 6–7: work-related emails, meetings, assignments.
   - 8–10: urgent messages, deadlines, critical issues.

The response must be in strict JSON format with two fields: "summary" and "importanceScore".

Example:
{"summary": "Invoice received and payment due next week.", "importanceScore": 7}

Subject: ${subject}
Body: ${truncatedBody}`;

  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const headers = {
    'Authorization': `Bearer ${GROQ_API_KEY}`,
    'Content-Type': 'application/json'
  };

  const payload = JSON.stringify({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: 'You are an assistant that responds with structured JSON only.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.4
  });

  const options = {
    method: 'post',
    headers: headers,
    payload: payload,
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseText = response.getContentText();
    Logger.log("Groq raw response: " + responseText);

    const json = JSON.parse(responseText);
    const modelReply = json.choices?.[0]?.message?.content?.trim() || "";

    Logger.log("Groq model reply: " + modelReply);

    let cleanReply = modelReply;
    if (cleanReply.startsWith('"') && cleanReply.endsWith('"')) {
      cleanReply = JSON.parse(cleanReply);  
    }

    cleanReply = cleanReply.replace(/```json\n?|```/g, '').trim();

    const parsed = JSON.parse(cleanReply);

    return {
      summary: parsed.summary || "No summary.",
      importanceScore: parseInt(parsed.importanceScore) || 0
    };

  } catch (e) {
    Logger.log("Groq API error: " + e.message);
    return {
      summary: "Error generating summary.",
      importanceScore: 0
    };
  }
}
