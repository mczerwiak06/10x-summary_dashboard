import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../db/database.types';
import type { PaginationParams } from '../schemas/pagination.schema';

/**
 * Event types that can be tracked in the analytics system
 */
export type AnalyticsEventType = 'transcript_created' | 'summary_generated' | 'summary_accepted' | 'summary_viewed';

/**
 * Service for tracking analytics events
 */
export class AnalyticsService {
  private supabase: SupabaseClient<Database>;
  private adminUserIds: string[];

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
    // Parse admin user IDs from environment variable
    this.adminUserIds = (import.meta.env.ADMIN_USER_IDS || '').split(',').filter(Boolean);
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
  
  /**
   * List analytics events for a user with pagination
   * 
   * @param requestingUserId The ID of the user making the request
   * @param targetUserId The ID of the user whose events to retrieve (requires admin if different from requestingUserId)
   * @param pagination Pagination parameters
   * @returns Paginated list of analytics events and next cursor
   * @throws Error if non-admin user tries to access another user's events
   */
  async listEvents(requestingUserId: string, targetUserId: string, pagination: PaginationParams) {
    // Check if user is requesting someone else's events
    if (requestingUserId !== targetUserId) {
      // Verify admin status
      if (!this.isAdmin(requestingUserId)) {
        throw new Error('Forbidden: Only admins can view other users\' analytics');
      }
    }
    
    let query = this.supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(pagination.limit);
    
    // Apply cursor-based pagination if cursor is provided
    if (pagination.cursor) {
      query = query.lt('created_at', pagination.cursor);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to list analytics events: ${error.message}`);
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
   * Check if a user is an admin
   * @param userId User ID to check
   * @returns true if user is an admin, false otherwise
   */
  isAdmin(userId: string): boolean {
    return this.adminUserIds.includes(userId);
  }
}
