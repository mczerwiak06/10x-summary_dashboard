import type { APIRoute } from 'astro';
import { z } from 'zod';
import { ZodError } from 'zod';

import { SummaryService } from '../../../services/summaryService';
import { AnalyticsService } from '../../../services/analyticsService';
import { StoreGeneratedSummarySchema } from '../../../schemas/summary.schema';
import { ValidationError, errorHandler, AppError } from '../../../utils/errors';
import type { SummaryDto } from '../../../types';

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Check worker secret
    const workerSecret = request.headers.get('X-Worker-Secret');
    const expectedSecret = import.meta.env.WORKER_SECRET;
    
    if (!workerSecret || workerSecret !== expectedSecret) {
      throw new AppError('Forbidden', 403);
    }

    // 2. Validate UUID param
    const idSchema = z.string().uuid('Invalid transcript ID format');
    
    try {
      idSchema.parse(params.transcriptId);
    } catch (error) {
      throw new ValidationError('Invalid transcript ID format');
    }

    // 3. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      throw new ValidationError('Body required');
    }

    // Add the transcriptId from the URL to the body for validation
    body.transcriptId = params.transcriptId;

    let validatedData;
    try {
      validatedData = StoreGeneratedSummarySchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError(error.errors[0].message);
      }
      throw error;
    }

    // 4. Store summary via service
    const summaryService = new SummaryService(locals.supabase);
    
    try {
      const summary = await summaryService.storeGeneratedSummary(
        validatedData.transcriptId,
        validatedData.summaryMarkdown
      );

      // 5. Log analytics event for summary generation
      const analyticsService = new AnalyticsService(locals.supabase);
      await analyticsService.trackEvent('summary_generated', summary.user_id, {
        summaryId: summary.id
      });

      // 6. Transform to DTO and return
      const summaryDto: SummaryDto = {
        id: summary.id,
        summaryMarkdown: summary.summary_markdown,
        transcriptId: summary.transcript_id,
        createdAt: summary.created_at,
        updatedAt: summary.updated_at
      };

      return new Response(JSON.stringify(summaryDto), {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Summary already exists for this transcript') {
        throw new AppError('Conflict', 409);
      }
      throw error;
    }
  } catch (error) {
    return errorHandler(error);
  }
};
