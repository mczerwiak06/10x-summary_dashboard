import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../db/database.types';

/**
 * Service for managing summarization jobs
 */
export class SummarizationService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Queue a summarization job for the given transcript ID
   * @param transcriptId The ID of the transcript to summarize
   * @throws Error if unable to queue the summarization job
   */
  async queueSummarization(transcriptId: string): Promise<void> {
    try {
      // Call Supabase Edge Function to handle summarization
      const { error } = await this.supabase.functions.invoke('summarize', {
        body: { transcriptId }
      });

      if (error) {
        throw new Error(`Failed to queue summarization: ${error.message}`);
      }
    } catch (error) {
      console.error('Error queueing summarization job:', error);
      throw new Error('Unable to queue summarisation');
    }
  }

  /**
   * Check the status of a summarization job
   * @param transcriptId The ID of the transcript
   * @returns The current status of the summarization
   */
  async checkSummarizationStatus(transcriptId: string): Promise<'processing' | 'ready' | 'error'> {
    // Check if a summary exists for this transcript
    const { data: summary, error } = await this.supabase
      .from('summaries')
      .select('id')
      .eq('transcript_id', transcriptId)
      .maybeSingle();

    if (error) {
      console.error('Error checking summarization status:', error);
      return 'error';
    }

    // If summary exists, it's ready
    if (summary) {
      return 'ready';
    }

    // Otherwise, it's still processing
    return 'processing';
  }
}
