# API Endpoint Implementation Plan: POST `/api/transcripts`

## 1. Endpoint Overview
Submits a raw meeting transcript for the authenticated user, immediately queues an AI summarisation job, and returns the newly-created transcript ID together with an initial workflow status of `processing`.

## 2. Request Details
- **HTTP Method:** POST
- **URL:** `/api/transcripts`
- **Headers:** `Authorization: Bearer <supabase-jwt>` (required)
- **Body (JSON):**
  ```json
  {
    "transcriptText": "string (<= 1 000 words)"
  }
  ```
- **Parameters:**
  - Required: `transcriptText`
  - Optional: *none*
- **Pre-conditions & Limits:**
  1. `transcriptText` ≤ **1 000 words** after trimming whitespace.
  2. Authenticated user has **< 20** existing transcripts (one-to-one with summaries) – quota enforcement.

## 3. Used Types
- `CreateTranscriptCommand` – request payload (already defined in `src/types.ts`).
- `CreateTranscriptResponseDto` – 202 Accepted response payload.
- `TranscriptRow` / `TranscriptInsert` – DB mapping types.
- `SummarisationStatus` (`"processing" | "ready" | "error"`).

## 4. Response Details

**202 Accepted**
- When: Transcript accepted & job queued
- Body: `{ "id": "uuid", "status": "processing" }`

**400 Bad Request**
- When: Validation failed: missing/empty text, >1 000 words
- Body: `{ "error": "<message>" }`

**401 Unauthorized**
- When: Missing/invalid JWT
- Body: *Empty*

**429 Too Many Requests**
- When: Quota ≥20 transcripts
- Body: `{ "error": "Quota exceeded (20)" }`

**500 Internal Server Error**
- When: Unhandled errors
- Body: `{ "error": "Internal server error" }`

## 5. Data Flow
1. **Auth Middleware** verifies `Authorization` header using Supabase JWT → extracts `user.id`.
2. **Input Validation Layer** (Zod schema) validates `transcriptText` length & word-count.
3. **Quota Service** queries `transcripts` count for `user.id`; if ≥20 → throw 429.
4. **Transcript Service** inserts new row in `transcripts` table (`user_id`, `transcript_text`).
5. **Job Dispatcher** publishes summarisation task to background worker (e.g., Supabase Function or queue).
6. **Analytics** (optional) may record an `analytics_events` row `event_type = 'summary_generated'` when summarisation completes (not part of this handler).
7. **Response** returns 202 with `{ id, status: "processing" }`.

## 6. Security Considerations
1. **Authentication**: Verify Supabase JWT via server runtime (`@supabase/auth-helpers`).
2. **Authorisation**: Insert always uses authenticated user’s ID → prevents spoofing; no cross-user access.
3. **SQL Injection**: Use Supabase JS client parameterised methods.
4. **Rate Limiting**: Per-IP / per-user middleware (e.g., `@netlify/edge-functions-rate-limit`) – beyond 429 quota.
5. **Input Sanitisation**: Strip/escape control chars if storing raw text could impact Markdown rendering later.
6. **Logging & Alerting**: Log all 4xx/5xx with correlation IDs; avoid logging JWT or PII.

## 7. Error Handling

The endpoint handles the following error scenarios:

- **400 Bad Request**:
  - Missing body: "Body required"
  - Missing `transcriptText`: "transcriptText is required"
  - Exceeding word limit: "transcriptText exceeds 1 000-word limit"

- **401 Unauthorized**:
  - Invalid JWT: "Unauthenticated"

- **429 Too Many Requests**:
  - Quota reached: "Quota exceeded (20 transcripts)"

- **500 Internal Server Error**:
  - Database failures: "Unable to save transcript"
  - Job queue failures: "Unable to queue summarisation"

Errors propagate through a central `errorHandler` middleware which maps custom `AppError` subclasses to status codes and JSON structures.

## 8. Performance Considerations
- **Single INSERT** and lightweight publish → fast (<50 ms).
- Use **database index** on `user_id` for fast quota lookup.
- Batch word-count using `split(/\s+/)` – O(n) where n = words.
- Non-blocking: summarisation runs asynchronously → 202.
- Apply compression (gzip/br) on responses by default.

## 9. Implementation Steps
1. **Define Zod Schema** (`CreateTranscriptSchema`) enforcing ≤1 000 words.
2. **Add API Route** `src/pages/api/transcripts/index.post.ts` (Astro server endpoint pattern).
3. **Add Auth Guard** using `getSupabaseServerClient()`; return 401 if absent.
4. **Parse & Validate Body** via schema → return 400 on failure.
5. **Instantiate `TranscriptService`** (new file `src/services/transcriptService.ts`) exposing:
   - `createTranscript(userId, text): Promise<UUID>`
   - internal `ensureQuota(userId)`.
6. **Insert Transcript** via Supabase client.
7. **Publish Job** – call Edge Function `summarise` or enqueue message (`supabase.functions.invoke`).
8. **Return 202 Response** with DTO mapping.
