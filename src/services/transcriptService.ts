import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../db/database.types';
import { QuotaExceededError } from '../utils/errors';
import type { PaginationParams } from '../schemas/pagination.schema';

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
  
  /**
   * Gets a transcript by ID, ensuring it belongs to the specified user
   * @param id Transcript ID
   * @param userId User ID
   * @returns The transcript or null if not found
   */
  async getTranscript(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from('transcripts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // PGRST116 is the error code for "no rows returned"
        return null;
      }
      throw new Error(`Failed to fetch transcript: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Lists transcripts for a user with pagination
   * @param userId User ID
   * @param pagination Pagination parameters
   * @returns Paginated list of transcripts and next cursor
   */
  async listTranscripts(userId: string, pagination: PaginationParams) {
    let query = this.supabase
      .from('transcripts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(pagination.limit);
    
    // Apply cursor-based pagination if cursor is provided
    if (pagination.cursor) {
      query = query.lt('created_at', pagination.cursor);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to list transcripts: ${error.message}`);
    }
    
    // Determine next cursor from the last item
    let nextCursor: string | undefined = undefined;
    if (data.length === pagination.limit) {
      nextCursor = data[data.length - 1].created_at;
    }
    
    return {
      items: data,
      nextCursor
    };
  }

  /**
   * Deletes a transcript by ID, ensuring it belongs to the specified user
   * @param id Transcript ID
   * @param userId User ID
   * @returns true if deleted, false if not found
   */
  async deleteTranscript(id: string, userId: string): Promise<boolean> {
    const { error, count } = await this.supabase
      .from('transcripts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      throw new Error(`Failed to delete transcript: ${error.message}`);
    }
    
    return count !== null && count > 0;
  }
}
