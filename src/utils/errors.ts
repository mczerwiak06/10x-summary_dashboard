/**
 * Base application error class with status code support
 */
export class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

/**
 * Thrown when input validation fails
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

/**
 * Thrown when authentication fails
 */
export class AuthenticationError extends AppError {
  constructor(message: string = "Unauthenticated") {
    super(message, 401);
  }
}

/**
 * Thrown when quota is exceeded
 */
export class QuotaExceededError extends AppError {
  constructor(message: string = "Quota exceeded (20 transcripts)") {
    super(message, 429);
  }
}

/**
 * Error handler for API endpoints
 */
export function errorHandler(error: unknown) {
  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  
  console.error("Unhandled error:", error);
  
  return new Response(
    JSON.stringify({ error: "Internal server error" }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" }
    }
  );
}
