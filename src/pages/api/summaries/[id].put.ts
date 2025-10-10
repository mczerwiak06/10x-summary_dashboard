import type { APIRoute } from 'astro';
import { z } from 'zod';
import { ZodError } from 'zod';

import { SummaryService } from '../../../services/summaryService';
import { AnalyticsService } from '../../../services/analyticsService';
import { UpdateSummarySchema } from '../../../schemas/summary.schema';
import { AuthenticationError, ValidationError, NotFoundError, errorHandler } from '../../../utils/errors';
import type { SummaryDto } from '../../../types';

export const PUT: APIRoute = async ({ params, request, locals }) => {
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

    // 2. Validate UUID param
    const idSchema = z.string().uuid('Invalid summary ID format');
    
    try {
      idSchema.parse(params.id);
    } catch (error) {
      throw new ValidationError('Invalid summary ID format');
    }

    // 3. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      throw new ValidationError('Body required');
    }

    let validatedData;
    try {
      validatedData = UpdateSummarySchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError(error.errors[0].message);
      }
      throw error;
    }

    // 4. Update summary via service
    const summaryService = new SummaryService(locals.supabase);
    const updatedSummary = await summaryService.updateSummary(
      params.id as string,
      user.id,
      validatedData.summaryMarkdown
    );

    if (!updatedSummary) {
      throw new NotFoundError('Summary not found');
    }

    // 5. Log analytics event for summary acceptance
    // We should check if this is the first update to track as "summary_accepted"
    const analyticsService = new AnalyticsService(locals.supabase);
    await analyticsService.trackEvent('summary_accepted', user.id, {
      summaryId: updatedSummary.id
    });

    // 6. Transform to DTO and return
    const summaryDto: SummaryDto = {
      id: updatedSummary.id,
      summaryMarkdown: updatedSummary.summary_markdown,
      transcriptId: updatedSummary.transcript_id,
      createdAt: updatedSummary.created_at,
      updatedAt: updatedSummary.updated_at
    };

    return new Response(JSON.stringify(summaryDto), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return errorHandler(error);
  }
};
