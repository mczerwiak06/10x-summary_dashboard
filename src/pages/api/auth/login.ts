import type { APIRoute } from 'astro';
import { ZodError } from 'zod';

import { AuthService } from '../../../services/authService';
import { AuthLoginSchema } from '../../../schemas/auth.schema';
import { ValidationError, AuthenticationError, errorHandler } from '../../../utils/errors';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      throw new ValidationError('Body required');
    }

    let validatedData;
    try {
      validatedData = AuthLoginSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError(error.errors[0].message);
      }
      throw error;
    }

    // 2. Login user via service
    const authService = new AuthService(locals.supabase);
    
    try {
      const { user, session } = await authService.login(
        validatedData.email,
        validatedData.password
      );

      // 3. Set auth cookie if session exists
      if (session) {
        locals.supabase.auth.setSession(session);
      }

      // 4. Return user data
      return new Response(JSON.stringify(user), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      // Login failures should return 401 Unauthorized
      throw new AuthenticationError('Invalid email or password');
    }
  } catch (error) {
    return errorHandler(error);
  }
};
