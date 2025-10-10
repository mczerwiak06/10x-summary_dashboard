# REST API Plan

## 1. Resources

• **AuthUser** – table `auth.users`. Supabase-managed user accounts; operations such as registration and login may be handled via Supabase or custom endpoints if needed.

• **Transcript** – table `transcripts`. Original meeting transcript (≤ 1 000 words) submitted by a user.

• **Summary** – table `summaries`. AI-generated and user-editable Markdown summary linked one-to-one with a transcript.

• **AnalyticsEvent** – table `analytics_events`. Event log capturing when summaries are generated or accepted.

---

## 2. Endpoints

### 2.1 Transcript Endpoints

* **POST `/api/transcripts`** – Submit a transcript and queue AI summarisation.
  * Header: `Authorization: Bearer <supabase-jwt>`
  * Body:
    ```json
    {
      "transcriptText": "string (<= 1000 words)"
    }
    ```
  * Success `202 Accepted` → `{ "id": "uuid", "status": "processing" }`
  * Errors: `400` text too long · `401` unauthenticated · `429` quota reached (20 summaries)

* **GET `/api/transcripts/:id`** – Retrieve a single transcript (owner-only).

* **GET `/api/transcripts`** – List transcripts for the authenticated user.
  * Query: `limit` (default 20), `cursor` (ISO timestamp for key-set pagination)

* **DELETE `/api/transcripts/:id`** – Hard-delete a transcript and its linked summary.

---

### 2.2 Summary Endpoints

* **GET `/api/summaries`** – List accepted summaries newest-first (paginated).

* **GET `/api/summaries/:id`** – Retrieve a single summary.

* **PUT `/api/summaries/:id`** – Update Markdown body (owner-only).
  * Body:
    ```json
    {
      "summaryMarkdown": "string"
    }
    ```

* **DELETE `/api/summaries/:id`** – Permanently delete a summary.

---

### 2.3 Summarisation Workflow

* **POST `/api/summarise/:transcriptId`** – *Internal* worker callback that stores the generated summary and emits an analytics event. Secured with `X-Worker-Secret` header.

* **GET `/api/summarise/status/:transcriptId`** – Poll summarisation status (`processing` · `ready` · `error`).

---

### 2.4 Analytics

* **GET `/api/analytics`** – Retrieve analytics events for the current user. Admins may filter by `userId`.

---

### 2.5 Authentication Helpers (proxy to Supabase)

* **POST `/api/auth/signup`** – Email/password sign-up (proxy to Supabase Auth).
* **POST `/api/auth/login`** – Email/password login → returns Supabase JWT & user.
* **POST `/api/auth/logout`** – Clear session cookie.

---

## 3. Authentication and Authorization

1. **Auth Scheme** – Supabase JWT supplied via `Authorization` header or HttpOnly cookie.
2. **Row-Level Security** – All queries run with caller’s JWT so Supabase RLS restricts rows to `user_id = auth.uid()`.
3. **Endpoint Guards** – Middleware rejects unauthenticated requests with `401`.
4. **Rate Limiting** – 100 requests/min/IP; `POST /api/transcripts` additionally limited to 20/day/user.
5. **Worker Secret** – AI-worker callbacks must include `X-Worker-Secret` or receive `403`.

---

## 4. Validation and Business Logic

### 4.1 Validation Rules

• `transcriptText` must be ≤ 1 000 words (PRD §3 “Transcript Submission”).

• Each user may have at most 20 summaries (including queued) (PRD US-011).

• `eventType` in analytics must be `"summary_generated"` or `"summary_accepted"` (DB schema line 30).

### 4.2 Business Logic Mapping

• **Submit Transcript & Generate Summary (US-002)** – Client POSTs transcript → service enqueues job and logs `summary_generated`. Worker POSTs generated summary back.

• **View Generated Summary Popup (US-003)** – Client polls summarisation status then fetches summary once ready.

• **Edit Before Acceptance (US-004)** – Client edits locally; on save → PUT summary.

• **Accept Summary (US-005)** – PUT summary triggers `summary_accepted` analytics insertion.

• **Delete Summary (US-010)** – DELETE summary cascades to related analytics events.

• **Quota Enforcement (US-011)** – Middleware counts user summaries + queued jobs; rejects new transcript with `429` if limit reached.

• **AI Failure Handling (US-012, US-013)** – Worker sets status `error` after 3 min; client may retry summarisation against same transcript hash.

• **Analytics Tracking (US-014)** – Service inserts analytics rows after generation and acceptance.

---

*All timestamps are ISO-8601 in UTC.*
