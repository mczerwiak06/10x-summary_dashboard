import { z } from 'zod';

/**
 * Validates the request payload for creating a transcript.
 * Ensures transcriptText is present and doesn't exceed 1000 words.
 */
export const CreateTranscriptSchema = z.object({
  transcriptText: z
    .string({
      required_error: "transcriptText is required",
      invalid_type_error: "transcriptText must be a string",
    })
    .min(1, "transcriptText cannot be empty")
    .refine(
      (text) => {
        const wordCount = text.trim().split(/\s+/).length;
        return wordCount <= 1000;
      },
      {
        message: "transcriptText exceeds 1000-word limit",
      }
    ),
});

export type CreateTranscriptSchemaType = z.infer<typeof CreateTranscriptSchema>;
