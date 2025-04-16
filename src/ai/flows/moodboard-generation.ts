'use server';
/**
 * @fileOverview Moodboard generation flow.
 *
 * - generateMoodboard - A function that generates moodboards based on customer profile.
 * - MoodboardInput - The input type for the generateMoodboard function.
 * - MoodboardOutput - The return type for the generateMoodboard function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const MoodboardInputSchema = z.object({
  customerProfile: z
    .string()
    .describe('A detailed profile of the customer including their budget, tastes, goals, and needs.'),
});
export type MoodboardInput = z.infer<typeof MoodboardInputSchema>;

const MoodboardOutputSchema = z.object({
  moodboardDescription: z.string().describe('A description of the generated moodboard.'),
  imageUrls: z.array(z.string()).describe('URLs of images representing the moodboard design.'),
});
export type MoodboardOutput = z.infer<typeof MoodboardOutputSchema>;

export async function generateMoodboard(input: MoodboardInput): Promise<MoodboardOutput> {
  return moodboardGenerationFlow(input);
}

const moodboardPrompt = ai.definePrompt({
  name: 'moodboardPrompt',
  input: {
    schema: z.object({
      customerProfile: z
        .string()
        .describe('A detailed profile of the customer including their budget, tastes, goals, and needs.'),
    }),
  },
  output: {
    schema: z.object({
      moodboardDescription: z.string().describe('A description of the generated moodboard.'),
      imageUrls: z.array(z.string()).describe('URLs of images representing the moodboard design.'),
    }),
  },
  prompt: `Based on the following customer profile:\n\n{{{customerProfile}}}\n\nGenerate a moodboard description and a list of image URLs that visually represent the described moodboard. The moodboard should closely align with the customer\'s preferences and needs.
\nOutput ONLY valid JSON according to the schema.  The image URLs MUST be publicly accessible.  Do not generate placeholder URLs.  The image URLs MUST point to a visual representation of the moodboard description.\n`,
});

const moodboardGenerationFlow = ai.defineFlow<typeof MoodboardInputSchema, typeof MoodboardOutputSchema>(
  {
    name: 'moodboardGenerationFlow',
    inputSchema: MoodboardInputSchema,
    outputSchema: MoodboardOutputSchema,
  },
  async input => {
    const {output} = await moodboardPrompt(input);
    // Ensure that imageUrls are valid URLs
    const validatedImageUrls = output?.imageUrls?.map(url => {
      try {
        new URL(url);
        return url;
      } catch (e) {
        console.error(`Invalid URL found: ${url}. Replacing with placeholder.`);
        return `https://picsum.photos/400/300`; // Replace invalid URLs with a default placeholder
      }
    }) || [];

    return {
      moodboardDescription: output?.moodboardDescription || 'A beautiful moodboard',
      imageUrls: validatedImageUrls.length > 0 ? validatedImageUrls : ['https://picsum.photos/400/300'], // Provide a default image if no valid URLs are available
    };
  }
);
