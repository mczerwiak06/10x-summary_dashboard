import type { APIRoute } from 'astro';
import { z } from 'zod';
import { TranscriptService } from '../../../services/transcriptService';
import { AuthenticationError, NotFoundError, ValidationError, errorHandler } from '../../../utils/errors';
import type { TranscriptDto } from '../../../types';

export const GET: APIRoute = async ({ params, request, locals }) => {
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
    const idSchema = z.string().uuid('Invalid transcript ID format');
    
    try {
      idSchema.parse(params.id);
    } catch (error) {
      throw new ValidationError('Invalid transcript ID format');
    }

    // 3. Get transcript via service
    const transcriptService = new TranscriptService(locals.supabase);
    const transcript = await transcriptService.getTranscript(params.id as string, user.id);

    if (!transcript) {
      throw new NotFoundError('Transcript not found');
    }

    // 4. Transform to DTO and return
    const transcriptDto: TranscriptDto = {
      id: transcript.id,
      transcriptText: transcript.transcript_text,
      createdAt: transcript.created_at
    };

    return new Response(JSON.stringify(transcriptDto), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return errorHandler(error);
  }
};
