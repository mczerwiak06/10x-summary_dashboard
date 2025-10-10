import type { APIRoute } from 'astro';
import { ZodError } from 'zod';

import { CreateTranscriptSchema } from '../../../schemas/transcript.schema';
import { TranscriptService } from '../../../services/transcriptService';
import { SummarizationService } from '../../../services/summarizationService';
import { AnalyticsService } from '../../../services/analyticsService';
import { AuthenticationError, ValidationError, errorHandler } from '../../../utils/errors';
import type { CreateTranscriptResponseDto } from '../../../types';

export const POST: APIRoute = async ({ request, locals }) => {
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

    // 2. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      throw new ValidationError('Body required');
    }

    try {
      const validatedData = CreateTranscriptSchema.parse(body);
      
      // 3. Create transcript via service
      const transcriptService = new TranscriptService(locals.supabase);
      const transcriptId = await transcriptService.createTranscript(
        user.id,
        validatedData.transcriptText
      );

      // 4. Queue summarization job
      const summarizationService = new SummarizationService(locals.supabase);
      await summarizationService.queueSummarization(transcriptId);

      // 5. Track analytics event
      const analyticsService = new AnalyticsService(locals.supabase);
      await analyticsService.trackEvent('transcript_created', user.id, {
        transcriptId
      });

      // 6. Return success response
      const response: CreateTranscriptResponseDto = {
        id: transcriptId,
        status: 'processing'
      };

      return new Response(JSON.stringify(response), {
        status: 202,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError(error.errors[0].message);
      }
      throw error;
    }
  } catch (error) {
    return errorHandler(error);
  }
};
