# API Endpoints Implementation Plan (excluding POST /api/transcripts)

This document details how to implement every remaining REST endpoint defined in `.ai/api-plan.md`.  The focus is on behaviour, security and validation rules **without** using markdown tables.

---

## 0. Global Conventions

• **Tech stack** – Astro 5 API routes, TypeScript 5, Supabase JS client, zod for validation, Vitest for tests.  
• **Authentication** – Supabase JWT via `Authorization: Bearer <token>` or HttpOnly cookie, verified with `@supabase/auth-helpers`.  
• **Pagination** – key-set using `limit` (1-50, default 20) and `cursor` (ISO timestamp of `created_at`). Responses wrap items in `{ items, nextCursor? }`.  
• **Error model** – All handlers call `errorHandler()` which maps custom `AppError` subclasses to `{ error }` JSON and proper status codes.  
• **DTO casing** – camelCase for API payloads; snake_case stays in DB.  
• **Services** – endpoints are thin; business logic lives in dedicated service classes under `src/services`.

---

## 1. Transcript Routes

### 1.1 GET `/api/transcripts/:id`

Purpose: fetch a single transcript that belongs to the authenticated user.

Request Requirements
* Path parameter `id` must be a valid UUID.
* User must be authenticated.

Response
* **200** → `TranscriptDto` (see `src/types.ts`).
* **404** if the transcript does not exist or is not owned by the caller.
* **401** on missing/invalid JWT.

Implementation Steps
1. Guard with `requireAuth()` → obtain `userId`.
2. Validate `id` via zod `uuid()`.
3. `TranscriptService.getTranscript(id, userId)` queries `transcripts` filtered by both `id` and `user_id`.
4. If no row, throw `AppError('Not found', 404)`.
5. Map to DTO and return JSON.

---

### 1.2 GET `/api/transcripts`

Purpose: list a user’s transcripts newest-first.

Request Requirements
* Optional query `limit` (1-50, default 20).
* Optional query `cursor` (ISO timestamp of last seen `created_at`).
* Authentication required.

Response
* **200** → `{ items: TranscriptListItemDto[], nextCursor?: string }`.

Implementation Steps
1. Guard auth, parse queries with zod.
2. Build Supabase query: `eq('user_id', userId).order('created_at', { ascending: false })` plus `lt('created_at', cursor)` if provided, `limit(limit)`.
3. Determine `nextCursor` from last item.
4. Return payload.

---

### 1.3 DELETE `/api/transcripts/:id`

Purpose: permanently remove a transcript and its one-to-one summary.

Behaviour & Status Codes
* **204** when deletion succeeds.
* **404** if transcript not found / not owner.
* **401** on auth failure.

Implementation Steps
1. Guard auth + validate UUID.
2. Execute a single Supabase delete with `delete().eq('user_id', userId).eq('id', id).single()` (FK cascade removes summary) **inside a transaction** to ensure atomicity.
3. Return `new Response(null,{status:204})`.

---

## 2. Summary Routes

### 2.1 GET `/api/summaries`

Public endpoint that lists accepted summaries (those whose owners have saved them). The list is global, ordered by `created_at DESC`.

Request
* Same pagination params as above.
* No authentication required.

Response
* **200** → paginated list of `SummaryListItemDto`.

Implementation Steps
1. Validate query params.
2. Query `summaries` ordered by `created_at` desc with pagination filters. No `user_id` constraint.
3. Return items + `nextCursor`.

Security Note: stored summaries are public by design. If privacy is later required, add RLS and auth guard.

---

### 2.2 GET `/api/summaries/:id`

Returns a single summary by ID. Public.

* **200** with `SummaryDto`.
* **404** if not found.

Implementation Steps: validate UUID → select by id → 404 if null.

---

### 2.3 PUT `/api/summaries/:id`

Allows an owner to update their summary markdown (e.g., after editing).

Request
* Auth required.
* Body follows `UpdateSummaryCommand` with field `summaryMarkdown` (non-empty, ≤10 000 chars).

Responses
* **200** with updated `SummaryDto`.
* **400** on validation failure.
* **404** when summary not owned/found.
* **401** on auth failure.

Implementation Steps
1. Guard auth, validate UUID + body.
2. `SummaryService.updateSummary(id, userId, md)` which updates row and returns new values.
3. On first successful update (previously untouched), log analytics event `summary_accepted` via `AnalyticsService.log()`.

---

### 2.4 DELETE `/api/summaries/:id`

Hard-delete a summary. Auth required.

* **204** on success.
* **404** or **401** otherwise.

Implementation similar to transcript delete but on `summaries` table.

---

## 3. Summarisation Workflow

### 3.1 POST `/api/summarise/:transcriptId`  (internal)

Used by the AI worker to store a generated summary.

Pre-conditions
* Header `X-Worker-Secret` must match `env.WORKER_SECRET`; otherwise respond `403`.
* Body matches `StoreGeneratedSummaryCommand`.

Flow
1. Validate secret and body.
2. Ensure transcript exists and has no existing summary. If present, throw `AppError('Conflict', 409)`.
3. Insert into `summaries` with foreign keys set.
4. Log analytics `summary_generated`.
5. Return **201 Created** with `SummaryDto`.

---

### 3.2 GET `/api/summarise/status/:transcriptId`

Allows the owner to poll summarisation status.

Responses
* **200** with `{ status: "processing" | "ready" | "error" }`.
* **404** if transcript not owned/found.

Logic to determine status: if corresponding summary row exists → `ready`; else if transcript older than 3 min → `error`; else `processing`.

---

## 4. Analytics Route

### GET `/api/analytics`

Returns analytics events for the caller. Admins can request another user’s events via query `userId`.

Authentication
* Required for normal users.
* Admin check implemented via `ADMIN_USER_IDS` environment list.

Response
* **200** with paginated `AnalyticsEventDto`.
* **403** if non-admin attempts cross-user query.

Implementation Steps
1. Guard auth.
2. If `userId` param present and not equal to caller, verify admin list.
3. Build query with pagination filters.

---

## 5. Auth Helper Routes

### POST `/api/auth/signup`

Input: `AuthSignupCommand` (email + password).  
Process: proxy to `supabase.auth.signUp()`.  
Success **201** with `AuthUserDto` and JWT cookie.  
Errors: **400** (invalid email/password), **409** (email taken).

### POST `/api/auth/login`

Input: `AuthLoginCommand`.  
Success **200** returns same payload and sets cookie.  
Errors: **401** on bad creds.

### POST `/api/auth/logout`

Clears cookie; always returns **204**.

---

## 6. Security & Validation Checklist

1. Always verify JWT and respect Supabase RLS for private routes.  
2. Validate UUIDs and input shapes with zod.  
3. Use timing-safe comparison for `X-Worker-Secret`.  
4. Implement IP rate-limiter middleware (100 req/min).  
5. Sanitize `summaryMarkdown` on client render; server stores raw markdown.

---

## 7. Error-to-Status Mapping

• `ValidationError` → 400  
• `AuthenticationError` → 401  
• `AppError('Forbidden')` → 403  
• `AppError('Not found')` → 404  
• `QuotaExceededError` → 429  
• `AppError('Conflict')` → 409  
• Unhandled → 500

---

## 8. Performance Notes

• Add composite indexes:  
  * `transcripts(user_id, created_at DESC)`  
  * `summaries(created_at DESC)`  
• Keep endpoint handlers thin; push heavy work (AI, analytics aggregation) to background jobs.  
• Enable gzip/br compression; prefer 202 for long-running actions.

---

## 9. Implementation Milestones

1. Define new zod schemas in `src/schemas/*`.  
2. Extend existing services or create `SummaryService` and `AnalyticsService`.  
3. Implement auth & admin middleware.  
4. Build each API route file in `src/pages/api/**`, wiring validation → service → error handler.

Once these steps are complete, the API surface described in `.ai/api-plan.md` will be fully implemented across all endpoints.
