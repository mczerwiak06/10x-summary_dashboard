import type { APIRoute } from 'astro';
import { z } from 'zod';
import { SummaryService } from '../../../../services/summaryService';
import { AuthenticationError, ValidationError, NotFoundError, errorHandler } from '../../../../utils/errors';
import type { SummarisationStatusDto } from '../../../../types';

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
      idSchema.parse(params.transcriptId);
    } catch (error) {
      throw new ValidationError('Invalid transcript ID format');
    }

    // 3. Get summarisation status via service
    const summaryService = new SummaryService(locals.supabase);
    
    try {
      const status = await summaryService.getSummarisationStatus(
        params.transcriptId as string,
        user.id
      );

      // 4. Return status
      const statusDto: SummarisationStatusDto = { status };

      return new Response(JSON.stringify(statusDto), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Transcript not found') {
        throw new NotFoundError('Transcript not found');
      }
      throw error;
    }
  } catch (error) {
    return errorHandler(error);
  }
};
