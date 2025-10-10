import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../db/database.types';
import type { PaginationParams } from '../schemas/pagination.schema';
import type { SummarisationStatus } from '../types';

/**
 * Service for managing summary operations
 */
export class SummaryService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Gets a summary by ID
   * @param id Summary ID
   * @returns The summary or null if not found
   */
  async getSummary(id: string) {
    const { data, error } = await this.supabase
      .from('summaries')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // PGRST116 is the error code for "no rows returned"
        return null;
      }
      throw new Error(`Failed to fetch summary: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Lists summaries with pagination
   * @param pagination Pagination parameters
   * @returns Paginated list of summaries and next cursor
   */
  async listSummaries(pagination: PaginationParams) {
    let query = this.supabase
      .from('summaries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(pagination.limit);
    
    // Apply cursor-based pagination if cursor is provided
    if (pagination.cursor) {
      query = query.lt('created_at', pagination.cursor);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to list summaries: ${error.message}`);
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
   * Updates a summary, ensuring it belongs to the specified user
   * @param id Summary ID
   * @param userId User ID
   * @param summaryMarkdown New markdown content
   * @returns The updated summary or null if not found
   */
  async updateSummary(id: string, userId: string, summaryMarkdown: string) {
    // First check if the summary exists and belongs to the user
    const { data: existingSummary, error: fetchError } = await this.supabase
      .from('summaries')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch summary: ${fetchError.message}`);
    }
    
    // Update the summary
    const { data, error } = await this.supabase
      .from('summaries')
      .update({
        summary_markdown: summaryMarkdown,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      throw new Error(`Failed to update summary: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Deletes a summary by ID, ensuring it belongs to the specified user
   * @param id Summary ID
   * @param userId User ID
   * @returns true if deleted, false if not found
   */
  async deleteSummary(id: string, userId: string): Promise<boolean> {
    const { error, count } = await this.supabase
      .from('summaries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      throw new Error(`Failed to delete summary: ${error.message}`);
    }
    
    return count !== null && count > 0;
  }

  /**
   * Stores a generated summary from the AI worker
   * @param transcriptId Transcript ID
   * @param summaryMarkdown Generated markdown content
   * @returns The created summary
   */
  async storeGeneratedSummary(transcriptId: string, summaryMarkdown: string) {
    // First get the transcript to get the user_id
    const { data: transcript, error: transcriptError } = await this.supabase
      .from('transcripts')
      .select('user_id')
      .eq('id', transcriptId)
      .single();
    
    if (transcriptError) {
      throw new Error(`Failed to fetch transcript: ${transcriptError.message}`);
    }
    
    // Check if a summary already exists for this transcript
    const { count, error: countError } = await this.supabase
      .from('summaries')
      .select('*', { count: 'exact', head: true })
      .eq('transcript_id', transcriptId);
    
    if (countError) {
      throw new Error(`Failed to check existing summaries: ${countError.message}`);
    }
    
    if (count && count > 0) {
      throw new Error('Summary already exists for this transcript');
    }
    
    // Insert the summary
    const { data, error } = await this.supabase
      .from('summaries')
      .insert({
        transcript_id: transcriptId,
        user_id: transcript.user_id,
        summary_markdown: summaryMarkdown
      })
      .select('*')
      .single();
    
    if (error) {
      throw new Error(`Failed to store summary: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Gets the summarisation status for a transcript
   * @param transcriptId Transcript ID
   * @param userId User ID
   * @returns The summarisation status
   */
  async getSummarisationStatus(transcriptId: string, userId: string): Promise<SummarisationStatus> {
    // First check if the transcript exists and belongs to the user
    const { data: transcript, error: transcriptError } = await this.supabase
      .from('transcripts')
      .select('created_at')
      .eq('id', transcriptId)
      .eq('user_id', userId)
      .single();
    
    if (transcriptError) {
      if (transcriptError.code === 'PGRST116') {
        throw new Error('Transcript not found');
      }
      throw new Error(`Failed to fetch transcript: ${transcriptError.message}`);
    }
    
    // Check if a summary exists
    const { count, error: summaryError } = await this.supabase
      .from('summaries')
      .select('*', { count: 'exact', head: true })
      .eq('transcript_id', transcriptId);
    
    if (summaryError) {
      throw new Error(`Failed to check summary status: ${summaryError.message}`);
    }
    
    if (count && count > 0) {
      return 'ready';
    }
    
    // If transcript is older than 3 minutes and no summary exists, assume error
    const transcriptDate = new Date(transcript.created_at);
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    
    if (transcriptDate < threeMinutesAgo) {
      return 'error';
    }
    
    return 'processing';
  }
}
