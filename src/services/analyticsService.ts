import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../db/database.types';

/**
 * Event types that can be tracked in the analytics system
 */
export type AnalyticsEventType = 'transcript_created' | 'summary_generated' | 'summary_viewed';

/**
 * Service for tracking analytics events
 */
export class AnalyticsService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Track an analytics event
   * 
   * @param eventType The type of event to track
   * @param userId The ID of the user who triggered the event
   * @param metadata Optional metadata related to the event (e.g., transcript_id, summary_id)
   * @returns The ID of the created analytics event
   */
  async trackEvent(
    eventType: AnalyticsEventType,
    userId: string,
    metadata: {
      transcriptId?: string;
      summaryId?: string;
    } = {}
  ): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('analytics_events')
        .insert({
          event_type: eventType,
          user_id: userId,
          transcript_id: metadata.transcriptId,
          summary_id: metadata.summaryId
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error tracking analytics event:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Exception tracking analytics event:', error);
      return null;
    }
  }
}
