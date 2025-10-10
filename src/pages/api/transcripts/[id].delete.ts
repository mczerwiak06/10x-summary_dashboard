import type { APIRoute } from 'astro';
import { z } from 'zod';
import { TranscriptService } from '../../../services/transcriptService';
import { AuthenticationError, ValidationError, NotFoundError, errorHandler } from '../../../utils/errors';

export const DELETE: APIRoute = async ({ params, request, locals }) => {
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

    // 3. Delete transcript via service
    const transcriptService = new TranscriptService(locals.supabase);
    const deleted = await transcriptService.deleteTranscript(params.id as string, user.id);

    if (!deleted) {
      throw new NotFoundError('Transcript not found');
    }

    // 4. Return success with no content
    return new Response(null, {
      status: 204
    });
  } catch (error) {
    return errorHandler(error);
  }
};
