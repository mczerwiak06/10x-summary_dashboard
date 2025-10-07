# Product Requirements Document (PRD) - Meeting Summary Dashboard
## 1. Product Overview
The Meeting Summary Dashboard is a web-based application that enables users to quickly distill long online meeting transcripts (≤ 1 000 words) into concise, bullet-point summaries accompanied by a task list. Leveraging an external AI service for summarisation and task extraction, the product reduces the effort required to capture and store meeting outcomes. Authenticated users can generate, edit, accept, and manage up to twenty summaries in a two-column dashboard interface.

## 2. User Problem
1. Manually creating concise meeting summaries is time-consuming, so the task is often skipped.
2. Important action items mentioned during meetings are easily forgotten without a structured record.
3. Existing tools lack a simple, dedicated space for storing and revisiting meeting summaries.
4. Users need a lightweight solution that works in a web browser without installing additional software.

## 3. Functional Requirements
1. Transcript Submission: allow users to paste a plain-text English transcript (≤ 1 000 words).
2. AI Summarisation & Task Extraction: call external AI; cache response via transcript hash.
3. Summary Popup:
   • Display editable bullet-point summary and task list.
   • Provide Save (accept) and Close (reject) actions.
4. Summary Management:
   • View accepted summaries in right column, newest-to-oldest, infinite scroll.
   • Edit an existing summary (Markdown body).
   • Hard-delete a summary.
5. Capacity Limit: disable “Add new meeting transcription” button at 20 summaries, show tooltip.
6. Authentication: email + password sign-up / login; summaries tied to user account.
7. Analytics: record “summary generated” and “summary accepted” events.
8. Error Handling: show friendly banner and retry option if AI service fails; queue one job per user (3-minute SLA).

## 4. Product Boundaries
• In Scope (MVP)
  – Web dashboard (desktop & responsive mobile viewport).
  – Plain-text transcript input (English).
  – AI-powered summarisation & task extraction.
  – Edit, accept, hard-delete summaries; 20-summary limit.
  – Basic email/password authentication.
  – Success analytics (generated vs accepted).

• Out of Scope (MVP)
  – Sending summaries via email or other channels.
  – Importing PDF, DOCX, MP4, or other formats.
  – Native mobile applications.
  – Multi-language summarisation.

## 5. User Stories
ID: US-001
Title: User Authentication
Description: As a visitor I want to create an account or log in so that my summaries are securely stored.
Acceptance Criteria:
- User can sign up with email & password.
- User can log in and log out.
- Only authenticated users can access the dashboard.
- Session persists until explicit logout.

ID: US-002
Title: Submit Transcript
Description: As a user I can paste a transcript and request a summary.
Acceptance Criteria:
- “Add summary” button opens submission textarea.
- Character counter blocks transcripts > 1 000 words.
- Clicking “Summarise” starts generation and shows progress indicator.

ID: US-003
Title: View Generated Summary
Description: As a user I see the AI-generated summary and tasks in a popup.
Acceptance Criteria:
- Popup appears within 3 minutes.
- Summary shows bullet points; tasks under divider.
- Summary is editable before acceptance.

ID: US-004
Title: Edit Summary Before Acceptance
Description: As a user I can modify the generated summary or tasks before saving.
Acceptance Criteria:
- Text in popup is editable Markdown.
- Changes reflect immediately.
- No validation errors on save.

ID: US-005
Title: Accept Summary
Description: As a user I can accept the summary so it is stored in my list.
Acceptance Criteria:
- Clicking “Save” stores summary to DB.
- Popup closes.
- Summary appears in right column without page reload.

ID: US-006
Title: Reject Summary
Description: As a user I can discard an unsatisfactory summary.
Acceptance Criteria:
- Closing the popup without saving stores nothing.
- “summary generated” analytics still recorded.

ID: US-007
Title: View Accepted Summaries
Description: As a user I can browse my accepted summaries in reverse chronological order.
Acceptance Criteria:
- Right column lists summaries newest-to-oldest.
- Infinite scrolling loads items in batches.
- Date grouping headers shown.

ID: US-008
Title: Open Summary Detail
Description: As a user I can open any summary in read-only mode.
Acceptance Criteria:
- Clicking a list item opens popup read-only.
- Markdown rendered correctly.
- Delete & Edit buttons visible.

ID: US-009
Title: Edit Accepted Summary
Description: As a user I can update a saved summary.
Acceptance Criteria:
- Edit button toggles edit mode.
- Save persists changes and updates timestamp.
- Cancel restores original text.

ID: US-010
Title: Delete Summary
Description: As a user I can permanently delete a summary.
Acceptance Criteria:
- Delete prompts confirmation.
- Confirm removes summary from DB and list.
- “Add” button re-enabled if total < 20.

ID: US-011
Title: Enforce Summary Limit
Description: As a user I cannot create more than 20 summaries.
Acceptance Criteria:
- When count = 20, “Add summary” disabled.
- Tooltip explains limit.
- Deleting a summary re-enables button.

ID: US-012
Title: Handle AI Failure
Description: As a user I receive an error message if summarisation fails.
Acceptance Criteria:
- Friendly banner shown on failure.
- “Retry” button resubmits job.
- Failure does not consume summary quota.

ID: US-013
Title: Performance SLA
Description: As a user I expect summary generation within 3 minutes.
Acceptance Criteria:
- Progress indicator displayed.
- If generation exceeds 3 minutes, error banner with retry appears.

ID: US-014
Title: Analytics Tracking
Description: As a product owner I want to track generated and accepted events.
Acceptance Criteria:
- “summary generated” event sent on every generation.
- “summary accepted” event sent when user saves.
- Acceptance rate calculable over time.

## 6. Success Metrics
1. Summary Acceptance Rate ≥ 75 % (accepted ÷ generated).

