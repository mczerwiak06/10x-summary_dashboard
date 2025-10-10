import type { APIRoute } from 'astro';
import { AuthService } from '../../../services/authService';
import { errorHandler } from '../../../utils/errors';

export const POST: APIRoute = async ({ locals }) => {
  try {
    // 1. Logout user via service
    const authService = new AuthService(locals.supabase);
    await authService.logout();

    // 2. Return success with no content
    return new Response(null, {
      status: 204
    });
  } catch (error) {
    return errorHandler(error);
  }
};
