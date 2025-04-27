/**
 * @fileOverview Generates a customer profile based on questionnaire responses.
 *
 * - generateCustomerProfile - A function that handles the customer profile generation process.
 * - CustomerProfileInput - The input type for the generateCustomerProfile function.
 * - CustomerProfileOutput - The return type for the generateCustomerProfile function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Define a schema that accepts any string as input
const CustomerProfileInputSchema = z.record(z.string());
export type CustomerProfileInput = z.infer<typeof CustomerProfileInputSchema>;

const CustomerProfileOutputSchema = z.object({
  profileSummary: z.string().describe('A summary of the customer profile, including all provided information. Explicitly mention preferred design styles, color preferences, budget considerations, comfort and usability, lifestyle specifics, and cultural or personal touches.'),
});
export type CustomerProfileOutput = z.infer<typeof CustomerProfileOutputSchema>;

export async function generateCustomerProfile(input: CustomerProfileInput): Promise<CustomerProfileOutput> {
  return customerProfileFlow(input);
}

const prompt = ai.definePrompt({
  name: 'customerProfilePrompt',
  input: {
    schema: z.record(z.string()),
  },
  output: {
    schema: z.object({
      profileSummary: z.string().describe('A summary of the customer profile, including all provided information. Explicitly mention preferred design styles, color preferences, budget considerations, comfort and usability, lifestyle specifics, and cultural or personal touches.'),
    }),
  },
  prompt: `You are an expert interior designer specializing in understanding client needs and preferences.

  Based on the following information, generate a concise customer profile summary that integrates all available details.  Focus on budget, tastes, goals, and needs based on the data provided.  **Explicitly mention preferred design styles, color preferences, budget considerations, comfort and usability, lifestyle specifics, and cultural or personal touches.**

  The input will be a JSON object of key value pairs, where each key represents a design preference and value represents the answer.
  \`\`\`json
  {{{input}}}
  \`\`\`
  `,
});

const customerProfileFlow = ai.defineFlow<
  typeof CustomerProfileInputSchema,
  typeof CustomerProfileOutputSchema
>({
  name: 'customerProfileFlow',
  inputSchema: CustomerProfileInputSchema,
  outputSchema: CustomerProfileOutputSchema,
}, async input => {
  let retryCount = 0;
  const maxRetries = 3;
  let delay = 1000; // Initial delay of 1 second

  while (retryCount < maxRetries) {
    try {
      const {output} = await prompt({input: JSON.stringify(input, null, 2)});
      return output!;
    } catch (error: any) {
      if (error.message && error.message.includes('429 Too Many Requests')) {
        retryCount++;
        console.warn(`Rate limit hit. Retrying in ${delay / 1000} seconds... (Attempt ${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        // If it's not a rate limit error, re-throw it
        console.error('Error generating customer profile:', error);
        throw error;
      }
    }
  }

  // If we've exhausted all retries, throw an error
  throw new Error('Failed to generate customer profile after multiple retries due to rate limiting.');
});

