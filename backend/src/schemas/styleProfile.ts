import { z } from 'zod';

// Bria API Structured Prompt Schema
// Aligns with Bria's /structured_prompt/generate endpoint response
// See: https://docs.bria.ai/image-generation/v2-endpoints/structured-prompt-generate
export const StructuredPromptSchema = z.object({
  seed: z.number(),
  structured_prompt: z.string(), // JSON string describing the image
  imageIndex: z.number().optional(), // Index of the source image
});

// Style Profile Schema - Collection of structured prompts from multiple images
export const StyleProfileSchema = z.object({
  name: z.string().optional(),
  createdAt: z.string().optional(),
  images: z.array(StructuredPromptSchema), // Array of structured prompts from source images
  aggregated: z.any().optional(), // Optional combined/averaged style analysis
  processedImages: z.number(), // Number of images processed
});

export type StructuredPrompt = z.infer<typeof StructuredPromptSchema>;
export type StyleProfile = z.infer<typeof StyleProfileSchema>;

