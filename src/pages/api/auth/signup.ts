import type { APIRoute } from 'astro';
import { ZodError } from 'zod';

import { AuthService } from '../../../services/authService';
import { AuthSignupSchema } from '../../../schemas/auth.schema';
import { ValidationError, AppError, errorHandler } from '../../../utils/errors';

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
      validatedData = AuthSignupSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError(error.errors[0].message);
      }
      throw error;
    }

    // 2. Sign up user via service
    const authService = new AuthService(locals.supabase);
    
    try {
      const { user, session } = await authService.signup(
        validatedData.email,
        validatedData.password
      );

      // 3. Set auth cookie if session exists
      if (session) {
        locals.supabase.auth.setSession(session);
      }

      // 4. Return user data
      return new Response(JSON.stringify(user), {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Email already in use')) {
          throw new AppError('Email already in use', 409);
        }
      }
      throw error;
    }
  } catch (error) {
    return errorHandler(error);
  }
};
