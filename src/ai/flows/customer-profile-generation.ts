'use server';

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
  profileSummary: z.string().describe('A summary of the customer profile, including all provided information.'),
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
      profileSummary: z.string().describe('A summary of the customer profile, including all provided information.'),
    }),
  },
  prompt: `You are an expert interior designer specializing in understanding client needs and preferences.

  Based on the following information, generate a concise customer profile summary that integrates all available details.  Focus on budget, tastes, goals, and needs based on the data provided.

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
  const {output} = await prompt({input: JSON.stringify(input, null, 2)});
  return output!;
});
