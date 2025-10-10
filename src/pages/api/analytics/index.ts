import type { APIRoute } from 'astro';
import { ZodError } from 'zod';

import { AnalyticsService } from '../../../services/analyticsService';
import { PaginationSchema } from '../../../schemas/pagination.schema';
import { AuthenticationError, ValidationError, errorHandler, AppError } from '../../../utils/errors';
import type { AnalyticsEventDto } from '../../../types';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Authentication check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError();
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser(token);

    if (authError || !user) {
      throw new AuthenticationError();
    }

    // 2. Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      limit: url.searchParams.get('limit') || undefined,
      cursor: url.searchParams.get('cursor') || undefined,
    };
    
    // Get the target userId (defaults to the authenticated user)
    const targetUserId = url.searchParams.get('userId') || user.id;

    let paginationParams;
    try {
      paginationParams = PaginationSchema.parse(queryParams);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError(error.errors[0].message);
      }
      throw error;
    }

    // 3. Get analytics events via service
    const analyticsService = new AnalyticsService(locals.supabase);
    
    try {
      const { items, nextCursor } = await analyticsService.listEvents(
        user.id,
        targetUserId,
        paginationParams
      );

      // 4. Transform to DTOs
      const eventDtos: AnalyticsEventDto[] = items.map(event => ({
        id: event.id,
        eventType: event.event_type,
        createdAt: event.created_at,
        userId: event.user_id,
        summaryId: event.summary_id
      }));

      // 5. Return paginated response
      return new Response(JSON.stringify({
        items: eventDtos,
        nextCursor
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Forbidden')) {
        throw new AppError('Forbidden', 403);
      }
      throw error;
    }
  } catch (error) {
    return errorHandler(error);
  }
};
