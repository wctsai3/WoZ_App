// The use server directive must appear at the top of the file.
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating design recommendations based on a customer profile and moodboard.
 *
 * - generateDesignRecommendations - A function that generates design recommendations.
 * - DesignRecommendationInput - The input type for the generateDesignRecommendations function.
 * - DesignRecommendationOutput - The return type for the generateDesignRecommendations function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const DesignRecommendationInputSchema = z.object({
  customerProfile: z
    .string()
    .describe('A detailed profile of the customer including their budget, tastes, goals, and needs.'),
  finalMoodboardDescription: z
    .string()
    .describe('A description of the final moodboard that the customer has selected.'),
});
export type DesignRecommendationInput = z.infer<typeof DesignRecommendationInputSchema>;

const DesignRecommendationOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      item: z.string().describe('The specific design item being recommended.'),
      explanation: z
        .string()
        .describe('An AI-powered explanation of why this item matches the customer profile and moodboard.'),
    })
  ).describe('A list of specific design recommendations with explanations.'),
});
export type DesignRecommendationOutput = z.infer<typeof DesignRecommendationOutputSchema>;

export async function generateDesignRecommendations(
  input: DesignRecommendationInput
): Promise<DesignRecommendationOutput> {
  return generateDesignRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'designRecommendationPrompt',
  input: {
    schema: z.object({
      customerProfile: z
        .string()
        .describe('A detailed profile of the customer including their budget, tastes, goals, and needs.'),
      finalMoodboardDescription: z
        .string()
        .describe('A description of the final moodboard that the customer has selected.'),
    }),
  },
  output: {
    schema: z.object({
      recommendations: z.array(
        z.object({
          item: z.string().describe('The specific design item being recommended.'),
          explanation: z
            .string()
            .describe('An AI-powered explanation of why this item matches the customer profile and moodboard.'),
        })
      ).describe('A list of specific design recommendations with explanations.'),
    }),
  },
  prompt: `Based on the following customer profile and final moodboard description, generate specific design recommendations (colors, furniture, decor) along with AI-powered explanations linking each recommendation to the customer's needs, goals, and tastes.\n\nCustomer Profile: {{{customerProfile}}}\n\nFinal Moodboard Description: {{{finalMoodboardDescription}}}\n\nProvide the recommendations in a structured format, including the item and explanation for each. Limit of 5 recommendations.`, // Limited to 5 recommendations.
});

const generateDesignRecommendationsFlow = ai.defineFlow<
  typeof DesignRecommendationInputSchema,
  typeof DesignRecommendationOutputSchema
>({
  name: 'generateDesignRecommendationsFlow',
  inputSchema: DesignRecommendationInputSchema,
  outputSchema: DesignRecommendationOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
