import { z } from 'zod';

/**
 * Validates the request payload for updating a summary.
 */
export const UpdateSummarySchema = z.object({
  summaryMarkdown: z
    .string({
      required_error: "summaryMarkdown is required",
      invalid_type_error: "summaryMarkdown must be a string",
    })
    .min(1, "summaryMarkdown cannot be empty")
    .max(10000, "summaryMarkdown cannot exceed 10000 characters"),
});

export type UpdateSummarySchemaType = z.infer<typeof UpdateSummarySchema>;

/**
 * Validates the request payload for storing a generated summary.
 */
export const StoreGeneratedSummarySchema = z.object({
  transcriptId: z
    .string({
      required_error: "transcriptId is required",
      invalid_type_error: "transcriptId must be a string",
    })
    .uuid("transcriptId must be a valid UUID"),
  summaryMarkdown: z
    .string({
      required_error: "summaryMarkdown is required",
      invalid_type_error: "summaryMarkdown must be a string",
    })
    .min(1, "summaryMarkdown cannot be empty")
    .max(10000, "summaryMarkdown cannot exceed 10000 characters"),
});

export type StoreGeneratedSummarySchemaType = z.infer<typeof StoreGeneratedSummarySchema>;
