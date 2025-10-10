import type { APIRoute } from 'astro';
import { ZodError } from 'zod';

import { SummaryService } from '../../../services/summaryService';
import { PaginationSchema } from '../../../schemas/pagination.schema';
import { ValidationError, errorHandler } from '../../../utils/errors';
import type { SummaryListItemDto } from '../../../types';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      limit: url.searchParams.get('limit') || undefined,
      cursor: url.searchParams.get('cursor') || undefined,
    };

    let paginationParams;
    try {
      paginationParams = PaginationSchema.parse(queryParams);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError(error.errors[0].message);
      }
      throw error;
    }

    // 2. Get summaries via service
    const summaryService = new SummaryService(locals.supabase);
    const { items, nextCursor } = await summaryService.listSummaries(paginationParams);

    // 3. Transform to DTOs
    const summaryDtos: SummaryListItemDto[] = items.map(summary => ({
      id: summary.id,
      summaryMarkdown: summary.summary_markdown,
      transcriptId: summary.transcript_id,
      createdAt: summary.created_at,
      updatedAt: summary.updated_at
    }));

    // 4. Return paginated response
    return new Response(JSON.stringify({
      items: summaryDtos,
      nextCursor
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return errorHandler(error);
  }
};
