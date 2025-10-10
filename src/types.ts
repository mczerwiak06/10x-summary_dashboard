import type { Database } from "./db/database.types";

// --- Utility aliases to shorten row/insert/update type access ----------------

type PublicSchema = Database["public"];

type TranscriptRow = PublicSchema["Tables"]["transcripts"]["Row"];
// Provided because the POST /api/transcripts endpoint only needs transcript_text.
type TranscriptInsert = PublicSchema["Tables"]["transcripts"]["Insert"];

type SummaryRow = PublicSchema["Tables"]["summaries"]["Row"];
type SummaryInsert = PublicSchema["Tables"]["summaries"]["Insert"];
type SummaryUpdate = PublicSchema["Tables"]["summaries"]["Update"];

type AnalyticsEventRow = PublicSchema["Tables"]["analytics_events"]["Row"];

// --- Shared helpers ----------------------------------------------------------

/**
 * Possible workflow states for transcript summarisation.
 */
export type SummarisationStatus = "processing" | "ready" | "error";

// -----------------------------------------------------------------------------
// Transcript DTOs & Commands
// -----------------------------------------------------------------------------

/**
 * DTO representing a transcript returned by the API (owner-only).
 * Field types are sourced directly from the "transcripts" table definition to
 * ensure strong coupling with the database layer while exposing camelCase keys
 * expected by the frontend / API contract.
 */
export interface TranscriptDto {
  id: TranscriptRow["id"];
  transcriptText: TranscriptRow["transcript_text"];
  createdAt: TranscriptRow["created_at"];
}

/**
 * Request payload for `POST /api/transcripts`.
 */
export interface CreateTranscriptCommand {
  transcriptText: TranscriptInsert["transcript_text"];
}

/**
 * Response for `POST /api/transcripts` (202 Accepted).
 */
export interface CreateTranscriptResponseDto {
  id: TranscriptRow["id"];
  status: SummarisationStatus; // initially "processing"
}

/**
 * Lightweight list item returned by `GET /api/transcripts`.
 * Currently identical to TranscriptDto but declared separately to allow future
 * divergence (e.g., exclusions for huge fields).
 */
export type TranscriptListItemDto = TranscriptDto;

// -----------------------------------------------------------------------------
// Summary DTOs & Commands
// -----------------------------------------------------------------------------

export interface SummaryDto {
  id: SummaryRow["id"];
  summaryMarkdown: SummaryRow["summary_markdown"];
  transcriptId: SummaryRow["transcript_id"];
  createdAt: SummaryRow["created_at"];
  updatedAt: SummaryRow["updated_at"];
}

/**
 * Returned by `GET /api/summaries` (paginated list). Currently identical to
 * the full DTO but split for future flexibility.
 */
export type SummaryListItemDto = SummaryDto;

/**
 * Request payload for `PUT /api/summaries/:id`.
 */
export interface UpdateSummaryCommand {
  summaryMarkdown: SummaryUpdate["summary_markdown"];
}

/**
 * Internal worker callback payload for `POST /api/summarise/:transcriptId`.
 */
export interface StoreGeneratedSummaryCommand {
  transcriptId: SummaryRow["transcript_id"];
  summaryMarkdown: SummaryInsert["summary_markdown"];
}

// -----------------------------------------------------------------------------
// Summarisation-workflow DTOs
// -----------------------------------------------------------------------------

export interface SummarisationStatusDto {
  status: SummarisationStatus;
}

// -----------------------------------------------------------------------------
// Analytics DTOs
// -----------------------------------------------------------------------------

export interface AnalyticsEventDto {
  id: AnalyticsEventRow["id"];
  eventType: AnalyticsEventRow["event_type"];
  createdAt: AnalyticsEventRow["created_at"];
  userId: AnalyticsEventRow["user_id"];
  summaryId: AnalyticsEventRow["summary_id"];
}

// -----------------------------------------------------------------------------
// Authentication DTOs & Commands (proxy to Supabase Auth)
// -----------------------------------------------------------------------------

export interface AuthSignupCommand {
  email: string;
  password: string;
}

export interface AuthLoginCommand {
  email: string;
  password: string;
}

/**
 * Minimal user object returned after successful login/signup. We purposely keep
 * this small and independent from Supabase's full Auth type to avoid leaking
 * internal implementation details through the public API.
 */
export interface AuthUserDto {
  id: string;
  email: string | null;
}
