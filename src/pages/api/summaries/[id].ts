import type { APIRoute } from 'astro';
import { z } from 'zod';
import { SummaryService } from '../../../services/summaryService';
import { ValidationError, NotFoundError, errorHandler } from '../../../utils/errors';
import type { SummaryDto } from '../../../types';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Validate UUID param
    const idSchema = z.string().uuid('Invalid summary ID format');
    
    try {
      idSchema.parse(params.id);
    } catch (error) {
      throw new ValidationError('Invalid summary ID format');
    }

    // 2. Get summary via service
    const summaryService = new SummaryService(locals.supabase);
    const summary = await summaryService.getSummary(params.id as string);

    if (!summary) {
      throw new NotFoundError('Summary not found');
    }

    // 3. Transform to DTO and return
    const summaryDto: SummaryDto = {
      id: summary.id,
      summaryMarkdown: summary.summary_markdown,
      transcriptId: summary.transcript_id,
      createdAt: summary.created_at,
      updatedAt: summary.updated_at
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
