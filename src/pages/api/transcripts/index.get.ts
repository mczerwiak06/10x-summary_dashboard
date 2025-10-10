import type { APIRoute } from 'astro';
import { ZodError } from 'zod';

import { TranscriptService } from '../../../services/transcriptService';
import { PaginationSchema } from '../../../schemas/pagination.schema';
import { AuthenticationError, ValidationError, errorHandler } from '../../../utils/errors';
import type { TranscriptListItemDto } from '../../../types';

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

    let paginationParams;
    try {
      paginationParams = PaginationSchema.parse(queryParams);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError(error.errors[0].message);
      }
      throw error;
    }

    // 3. Get transcripts via service
    const transcriptService = new TranscriptService(locals.supabase);
    const { items, nextCursor } = await transcriptService.listTranscripts(
      user.id,
      paginationParams
    );

    // 4. Transform to DTOs
    const transcriptDtos: TranscriptListItemDto[] = items.map(transcript => ({
      id: transcript.id,
      transcriptText: transcript.transcript_text,
      createdAt: transcript.created_at
    }));

    // 5. Return paginated response
    return new Response(JSON.stringify({
      items: transcriptDtos,
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
