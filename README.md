# EmailAutomation
It streamlines the management of a high volume gmail inbox by extracting important emails from the day through an importance score and summarizing it. 

<img width="1906" height="764" alt="image" src="https://github.com/user-attachments/assets/80bc2e92-be95-43be-81a1-48557f7ca721" />


This project automates the daily processing of Gmail inbox messages using Google Apps Script. It extracts all emails received today, summarizes them using Groq's LLaMA 3 API, and assigns an importance score to each message. The top emails are logged into a connected Google Sheet dashboard for easy prioritization.

# Features
- Daily Email Processing: Fetches all emails received on the current day (not just unread or specific senders).
- AI Summarization: Uses Groq + LLaMA 3 to generate a concise summary of each email.
- Importance Scoring: Scores each message (e.g., spam = 3, meetings = 8+) to help prioritize.
- Google Sheet Logging: Stores key data- sender, subject, date, summary, score, and message ID.
- Custom Labeling: Marks processed threads with a Gmail label to avoid duplication.

# Files
1. Code.gs: Core logic for email extraction, processing, and writing to sheet.
2. GroqService.gs: Handles API calls to Groq for summary and scoring.
3. appsscript.json: Project manifest and configurations.

# Built With
-> Google Apps Script
-> Groq API (LLaMA 3)
-> Google Sheets
-> Gmail API

# Use Case
Ideal for interns, professionals, or productivity-focused users who want an AI assistant to summarize and prioritize emails, without reading through all of them manually.
