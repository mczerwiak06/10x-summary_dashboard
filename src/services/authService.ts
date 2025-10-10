import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../db/database.types';
import type { AuthUserDto } from '../types';

/**
 * Service for authentication operations
 */
export class AuthService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Sign up a new user with email and password
   * @param email User's email
   * @param password User's password
   * @returns User data and session
   * @throws Error if signup fails
   */
  async signup(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Check for email already in use
      if (error.message.includes('already registered')) {
        throw new Error('Email already in use');
      }
      throw new Error(`Signup failed: ${error.message}`);
    }

    if (!data.user) {
      throw new Error('Signup failed: No user returned');
    }

    // Map to DTO
    const userDto: AuthUserDto = {
      id: data.user.id,
      email: data.user.email
    };

    return {
      user: userDto,
      session: data.session
    };
  }

  /**
   * Log in a user with email and password
   * @param email User's email
   * @param password User's password
   * @returns User data and session
   * @throws Error if login fails
   */
  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(`Login failed: ${error.message}`);
    }

    if (!data.user) {
      throw new Error('Login failed: No user returned');
    }

    // Map to DTO
    const userDto: AuthUserDto = {
      id: data.user.id,
      email: data.user.email
    };

    return {
      user: userDto,
      session: data.session
    };
  }

  /**
   * Log out the current user
   * @returns true if successful
   * @throws Error if logout fails
   */
  async logout() {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }

    return true;
  }
}
