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
  // Add input validation and logging
  console.log('Generating design recommendations');
  
  try {
    // Check for required inputs
    if (!input.customerProfile) {
      throw new Error('Customer profile is required for generating recommendations');
    }

    // Ensure moodboard description has a fallback
    const safeInput = {
      customerProfile: input.customerProfile,
      finalMoodboardDescription: input.finalMoodboardDescription || 'Initial design moodboard based on customer profile',
    };
    
    return await generateDesignRecommendationsFlow(safeInput);
  } catch (error) {
    console.error('Error in generateDesignRecommendations:', error);
    
    // Provide fallback recommendations if the AI generation fails
    return {
      recommendations: [
        {
          item: 'Ergonomic furniture pieces',
          explanation: 'Quality furniture that balances comfort and style to match your aesthetic preferences while providing functional seating options for your space.'
        },
        {
          item: 'Smart lighting solutions',
          explanation: 'Layered lighting options that enhance the ambiance of your space while providing both task lighting and mood lighting as needed.'
        },
        {
          item: 'Cohesive color palette',
          explanation: 'A harmonious selection of colors that ties your space together while reflecting your personal style preferences.'
        }
      ]
    };
  }
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
  let retryCount = 0;
  const maxRetries = 3;
  let delay = 1000; // Initial delay of 1 second

  while (retryCount < maxRetries) {
    try {
      console.log(`Attempt ${retryCount + 1}/${maxRetries} to generate design recommendations`);
      
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 15000); // 15-second timeout
      });
      
      // Race the API call against the timeout
      const result = await Promise.race([
        prompt(input),
        timeoutPromise
      ]);
      
      // Validate the output structure
      if (!result || !result.output || !Array.isArray(result.output.recommendations)) {
        throw new Error('Invalid response structure from AI service');
      }
      
      // Validate each recommendation
      const validRecommendations = result.output.recommendations.map(rec => {
        // Ensure the recommendation has required fields
        if (!rec.item || !rec.explanation) {
          return {
            item: rec.item || 'Design element',
            explanation: rec.explanation || 'This element complements your design preferences.'
          };
        }
        return rec;
      });
      
      // Ensure we have at least one recommendation
      if (validRecommendations.length === 0) {
        throw new Error('No valid recommendations were generated');
      }
      
      console.log(`Successfully generated ${validRecommendations.length} design recommendations`);
      return { recommendations: validRecommendations };
    } catch (error: any) {
      console.error(`Recommendation generation error:`, error);
      
      if (error.message.includes('429 Too Many Requests')) {
        retryCount++;
        console.warn(`Rate limit hit. Retrying in ${delay / 1000} seconds... (Attempt ${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else if (error.message.includes('timeout') || error.name === 'AbortError') {
        // Handle timeout specifically
        retryCount++;
        console.warn(`Request timed out. Retrying... (Attempt ${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Less aggressive backoff for timeouts
      } else {
        // For any other error, try one more time with simplified input
        retryCount++;
        console.warn(`Error during generation. Retrying with simplified input... (Attempt ${retryCount}/${maxRetries})`);
        
        // Simplify the input for retry
        const simplifiedInput = {
          customerProfile: input.customerProfile.split('\n').slice(0, 5).join('\n'), // Take only first 5 lines
          finalMoodboardDescription: 'Simple, elegant design'
        };
        
        input = simplifiedInput;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // If we've exhausted all retries, return a basic set of recommendations
  console.error('Failed to generate design recommendations after multiple retries');
  return {
    recommendations: [
      {
        item: 'Versatile furniture pieces',
        explanation: 'Multi-functional furniture that adapts to your needs while complementing your space.'
      },
      {
        item: 'Balanced lighting elements',
        explanation: 'A combination of ambient, task, and accent lighting to create the right atmosphere.'
      },
      {
        item: 'Textural accessories',
        explanation: 'Accessories that add visual interest and tactile elements to your space.'
      }
    ]
  };
});