# UI Architecture for Meeting Summary Dashboard

## 1. UI Structure Overview
The Meeting Summary Dashboard is a desktop-first web application with two access tiers:
1. **Guest** – may view the Landing, Sign-up, and Login pages.
2. **Authenticated User** – gains access to the Dashboard, which hosts all summary-related functionality.

The authenticated area uses a global `Layout` composed of:
• **Header** – brand logo, page title, and user avatar/drop-down (logout).  
• **Content Region** – two-column flexible grid:  
  – **Main Column (left, 66 %)** – shows transcript submission flow or a selected summary.  
  – **Sidebar (right, 34 %)** – lists accepted summaries newest-first with infinite scroll.

Modals are layered above the layout for transcript submission and summarisation. A dismissible **ErrorBanner** is rendered directly beneath the Header and queues multiple messages.

All data fetching and mutations are handled through TanStack Query with optimistic updates; authentication state is stored in React Context. WCAG AA accessibility targets are achieved via Shadcn/ui components themed by brand tokens.

## 2. View List

### 2.1 Landing Page
- **Path:** `/`  
- **Purpose:** Marketing splash to explain value proposition and convert visitors.  
- **Key Information:** Product tagline, feature bullets, “Sign Up Free” CTA, footer links.  
- **Key Components:** HeroSection, FeatureList, PrimaryButton.  
- **UX / Accessibility / Security:** High-contrast colour usage; CTA is focusable first; no authenticated data.

### 2.2 Sign-up Page
- **Path:** `/signup`  
- **Purpose:** Create new account via email & password.  
- **Key Information:** Sign-up form fields, password rules, in-form error hints, link to Login.  
- **Key Components:** AuthForm (mode="signup"), RequiredFieldValidator, InlineError, SubmitButton.  
- **UX / Accessibility / Security:** Client-side required-field checks; POST `/api/auth/signup`; inline banner on 4xx; fields labelled for screen readers; password not stored client-side.

### 2.3 Login Page
- **Path:** `/login`  
- **Purpose:** Authenticate returning users.  
- **Key Information:** Email & password fields, “Forgot password?” link (future), link to Sign-up.  
- **Key Components:** AuthForm (mode="login"), InlineError, SubmitButton.  
- **UX / Accessibility / Security:** Same validation & banner pattern; POST `/api/auth/login`; JWT stored in memory context.

### 2.4 Dashboard (Authenticated Shell)
- **Path:** `/dashboard`  
- **Purpose:** Primary workspace for transcript submission and summary management.  
- **Key Information & Components:**
  • **Header** – App name, AddTranscriptButton, AvatarMenu.  
  • **ErrorBanner** – stacked/dismissible queued alerts.  
  • **Main Column** – default empty-state illustration with “Start by adding a transcript”; otherwise renders SummaryDetail or EditForm.  
  • **Sidebar (SummaryList)** – list of SummaryCard items with infinite scrolling, click action loads SummaryDetail.  
  • **Pagination Skeletons** – shown during fetchMore.  
- **UX / Accessibility / Security:** Keyboard navigation through sidebar list; ARIA-selected on active card; summaries fetched via GET `/api/summaries` with cursor pagination; RLS enforced by backend, client hides nothing-found vs unauthenticated via 401 handling.

### 2.5 Transcript Modal
- **Path (internal state):** `/dashboard/add-transcript` (modal route)  
- **Purpose:** Collect transcript text and initiate summarisation.  
- **Key Information:** Textarea (max 10 000 chars), character counter, “Summarise” button.  
- **Key Components:** Modal, TextArea, CharCounter, SubmitButton.  
- **UX / Accessibility / Security:** Live validation disables submit >10 000 chars; submits POST `/api/transcripts`; on 429 quota reached shows inline error; modal not closable while processing.

### 2.6 Summarisation Progress (Modal state)
- **Purpose:** Show generation progress while polling.  
- **Key Information:** Centered ProgressBar, skeleton placeholder of summary, cancel disabled.  
- **Components:** ProgressBar (indeterminate), PollingHook (GET `/api/summarise/status/:id`).  
- **Edge States:** On >3 min or `error` status → error banner inside modal, Retry button.

### 2.7 Generated Summary Preview (Modal state)
- **Purpose:** Present AI-generated summary & tasks for review before saving.  
- **Key Information:** Editable Markdown textarea (summary & tasks split by divider), “Save” & “Close” actions.  
- **Components:** MarkdownEditor, SaveButton, CloseButton.  
- **UX / Accessibility / Security:** Save triggers PUT `/api/summaries/:id`; optimistic update; Close discards; modal focus trap maintained.

### 2.8 Summary Detail View
- **Path (internal):** `/dashboard/summary/:id`  
- **Purpose:** Read-only display of a saved summary inside Main Column.  
- **Key Information:** Rendered Markdown, Edit & Delete buttons, timestamp.  
- **Components:** MarkdownRenderer, SecondaryButton(Edit), DangerButton(Delete).  
- **UX / Accessibility / Security:** Delete prompts confirmation modal then DELETE `/api/summaries/:id`; Edit switches to EditSummaryForm with inline Save/Cancel.

### 2.9 Error (Fallback) Page
- **Path:** `*`  
- **Purpose:** Catch-all for unknown routes.  
- **Key Information:** 404 illustration, link to Landing or Dashboard depending on auth.  
- **Components:** CenteredMessage, LinkButton.

## 3. User Journey Map

1. **Guest Landing → Sign-up**  
   a. Visitor lands on `/`, clicks “Sign Up Free”.  
   b. Completes form on `/signup`; client validates → POST `/api/auth/signup`.  
   c. On success JWT stored, redirect `/dashboard`; on failure banner shows.
2. **Login Returning User**  
   a. Goes to `/login`, submits credentials; success redirects `/dashboard`.
3. **Add Transcript & Generate Summary**  
   a. In Dashboard clicks “Add transcript” → TranscriptModal appears.  
   b. Enters text ≤ 10 000 chars; submits → POST `/api/transcripts` (202).  
   c. UI switches to Progress state, polls `/api/summarise/status/:id` until `ready`.  
   d. On ready, modal shows AI summary; user edits & clicks “Save” → PUT `/api/summaries/:id`.  
   e. Modal closes, Sidebar prepends new summary; Main Column unchanged.
4. **Browse & Open Summary**  
   a. User scrolls Sidebar; infinite scroll fetches `/api/summaries?cursor=...`.  
   b. Clicks SummaryCard → Main Column loads SummaryDetail via GET `/api/summaries/:id`.
5. **Edit / Delete Summary**  
   a. In detail view clicks Edit → switches to MarkdownEditor; Save PUTs update.  
   b. Delete prompts confirm → DELETE `/api/summaries/:id`; Sidebar updates; if left column was this summary, show empty state.
6. **Logout**  
   a. User avatar → Logout → clears auth context, redirect `/login`.

## 4. Layout and Navigation Structure

- **Routing:** React-Router nested structure:
  `/` (Landing)  
  ├─ `/signup`  
  ├─ `/login`  
  └─ `/dashboard/*` (requires auth)  
      ├─ index (empty state / summary detail)  
      └─ modal routes (add-transcript etc.)

- **Navigation Elements:**
  • Primary CTA on Landing → Sign-up.  
  • Secondary link between Sign-up and Login.  
  • Avatar dropdown for Logout.  
  • Sidebar SummaryList acts as intra-dashboard navigation.

- **Focus Management:** Modals are focus-trapped; Escape key disabled during processing; Header avatar menu closes on outside click or Escape.

## 5. Key Components (Cross-View)

### Key Components (Cross-View)

- **Header**: Sticky top bar with logo, title, AddTranscriptButton, AvatarMenu
  - Props: `onAddTranscript`, `user`

- **AddTranscriptButton**: Primary button triggering TranscriptModal; disabled at quota 20
  - Props: `disabled`

- **TranscriptModal**: Multi-step modal handling text input, progress, and generated preview
  - Props: `step`, `transcriptId`

- **ProgressBar**: Indeterminate or percentage bar used during summarisation
  - Props: `variant`

- **SummaryCard**: Condensed view of summary for list
  - Props: `summary`, `selected`

- **SummaryList**: Infinite scroll list in sidebar
  - Props: `items`, `onFetchMore`, `selectedId`

- **SummaryDetail**: Full Markdown view with Edit/Delete actions
  - Props: `summary`

- **ErrorBanner**: Queued, dismissible alerts below Header
  - Props: `message`, `type`, `id`

- **AuthForm**: Reusable email/password form
  - Props: `mode` (signup / login)

- **Modal**: Accessible dialog wrapper from Shadcn/ui
  - Props: `isOpen`, `onClose`

- **MarkdownEditor**: Textarea with Markdown formatting support
  - Props: `value`, `onChange`

---

### Requirement Mapping
- **US-001 (Auth)** – Sign-up & Login pages + auth context, Header avatar, route guards.
- **US-002 / 003 / 004 (Submit & View Summary)** – AddTranscriptButton, TranscriptModal steps.
- **US-005 (Accept Summary)** – Save button in Generated Preview, Sidebar update.
- **US-006 (Reject Summary)** – Close without save in Generated Preview.
- **US-007 / 008 (List & Detail)** – SummaryList & SummaryDetail views.
- **US-009 (Edit)** – EditSummaryForm within SummaryDetail.
- **US-010 (Delete)** – Delete confirmation & sidebar removal.
- **US-011 (Limit)** – AddTranscriptButton disabled at 20; server 429 handled.
- **US-012 / 013 (Error & SLA)** – ErrorBanner + summarisation polling & timeout.
- **US-014 (Analytics)** – No UI element (service-side only) – UI triggers events via API.

### Edge Cases & Error States Handled
• Network failures → ErrorBanner with retry.  
• Summarisation job timeout (>3 min) → Progress modal shows error & Retry.  
• API 401 → Auth context cleared & redirect to `/login`.  
• API 429 on transcript POST → inline modal error & button disabled.  
• Max summaries reached → AddTranscriptButton disabled with tooltip.

### Addressing User Pain Points
• **Time-saving:** One-click transcript submission & progress feedback.  
• **Remembering tasks:** Clear bullet-point summary & tasks emphasis.  
• **Quota clarity:** Button states & tooltip communicate limits.  
• **Error transparency:** Centralised banner with queued messages.

This architecture aligns fully with the REST API endpoints and satisfies all PRD user stories while maintaining accessibility and security best practices.
