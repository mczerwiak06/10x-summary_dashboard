import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../db/database.types';
import { QuotaExceededError } from '../utils/errors';

/**
 * Service for managing transcript operations
 */
export class TranscriptService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Ensures the user hasn't exceeded their transcript quota (max 20)
   * @throws {QuotaExceededError} If quota is exceeded
   */
  async ensureQuota(userId: string): Promise<void> {
    const { count, error } = await this.supabase
      .from('transcripts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      throw new Error('Failed to check transcript quota');
    }

    if (count !== null && count >= 20) {
      throw new QuotaExceededError();
    }
  }

  /**
   * Creates a new transcript for the user
   * @throws {QuotaExceededError} If quota is exceeded
   */
  async createTranscript(userId: string, transcriptText: string): Promise<string> {
    // First check quota
    await this.ensureQuota(userId);

    // Insert transcript
    const { data, error } = await this.supabase
      .from('transcripts')
      .insert({
        user_id: userId,
        transcript_text: transcriptText
      })
      .select('id')
      .single();

    if (error) {
      throw new Error('Unable to save transcript');
    }

    return data.id;
  }
}
