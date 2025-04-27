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
  designRecommendations: z.array(
    z.object({
      item: z.string().describe('The specific design item being recommended.'),
      explanation: z
        .string()
        .describe('An AI-powered explanation of why this item matches the customer profile and moodboard.'),
    })
  ).describe('A list of specific design recommendations with explanations.'),
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
      prompt: z
        .string()
        .describe('A prompt to generate image.'),
    }),
  },
  output: {
    schema: z.object({
      imageUrl: z.string().describe('URL of image representing the design.'),
    }),
  },
  prompt: `Generate URL of image based on the following prompt:\n\n{{{prompt}}}\n\nOutput ONLY valid JSON according to the schema.  The image URLs MUST be publicly accessible.  Do not generate placeholder URLs.  The image URLs MUST point to a visual representation of the prompt.\n`,
});

const moodboardGenerationFlow = ai.defineFlow<typeof MoodboardInputSchema, typeof MoodboardOutputSchema>(
  {
    name: 'moodboardGenerationFlow',
    inputSchema: MoodboardInputSchema,
    outputSchema: MoodboardOutputSchema,
  },
  async input => {
    const {designRecommendations} = input;
    const imageUrls: string[] = [];

    if (designRecommendations && designRecommendations.length > 0) {
      for (const recommendation of designRecommendations) {
        try {
          const {output} = await moodboardPrompt({prompt: recommendation.item + ', ' + recommendation.explanation});
          if (output?.imageUrl) {
            imageUrls.push(output.imageUrl);
          } else {
            console.warn(`Failed to generate image for recommendation: ${recommendation.item}`);
            imageUrls.push('https://picsum.photos/400/300'); // Fallback URL
          }
        } catch (error) {
          console.error(`Error generating image for recommendation: ${recommendation.item}`, error);
          imageUrls.push('https://picsum.photos/400/300'); // Fallback URL
        }
      }
    }
    return {
      moodboardDescription: 'A beautiful moodboard',
      imageUrls: imageUrls.length > 0 ? imageUrls : ['https://picsum.photos/400/300'], // Provide a default image if no valid URLs are available
    };
  }
);
