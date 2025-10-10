import { z } from 'zod';

/**
 * Schema for key-set pagination parameters
 */
export const PaginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 20;
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) return 20;
      return Math.min(Math.max(parsed, 1), 50);
    }),
  cursor: z
    .string()
    .datetime({ message: 'Invalid cursor format. Must be ISO timestamp.' })
    .optional(),
});

export type PaginationParams = z.infer<typeof PaginationSchema>;
