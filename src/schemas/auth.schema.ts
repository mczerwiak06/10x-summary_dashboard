import { z } from 'zod';

/**
 * Validates the request payload for user signup.
 */
export const AuthSignupSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string",
    })
    .email("Invalid email format"),
  password: z
    .string({
      required_error: "Password is required",
      invalid_type_error: "Password must be a string",
    })
    .min(8, "Password must be at least 8 characters"),
});

export type AuthSignupSchemaType = z.infer<typeof AuthSignupSchema>;

/**
 * Validates the request payload for user login.
 */
export const AuthLoginSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string",
    })
    .email("Invalid email format"),
  password: z
    .string({
      required_error: "Password is required",
      invalid_type_error: "Password must be a string",
    }),
});

export type AuthLoginSchemaType = z.infer<typeof AuthLoginSchema>;
