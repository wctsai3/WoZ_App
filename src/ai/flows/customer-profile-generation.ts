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
  profileSummary: z.string().describe('A summary of the customer profile, including all provided information. Explicitly mention preferred design styles, color preferences, budget considerations, comfort and usability, lifestyle specifics, and cultural or personal touches.'),
});
export type CustomerProfileOutput = z.infer<typeof CustomerProfileOutputSchema>;

export async function generateCustomerProfile(input: CustomerProfileInput): Promise<CustomerProfileOutput> {
  // Add input validation and logging
  console.log(`Generating customer profile with input keys: ${Object.keys(input).join(', ')}`);
  
  try {
    // Sanitize input by ensuring all values are strings
    const sanitizedInput: Record<string, string> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitizedInput[key] = value !== null && value !== undefined ? String(value) : '';
    }
    
    // Enhanced error handling around the profile generation
    return await customerProfileFlow(sanitizedInput);
  } catch (error) {
    console.error('Error in generateCustomerProfile:', error);
    
    // Provide a fallback profile if generation fails
    return {
      profileSummary: `A design profile for a client seeking interior design assistance. The client is looking for professional guidance to transform their space. Preferences include a balanced aesthetic with functional considerations. The design should accommodate the client's needs while maintaining a cohesive style throughout the space.`
    };
  }
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
      // Log each attempt
      console.log(`Attempt ${retryCount + 1}/${maxRetries} to generate customer profile`);
      
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 15000); // 15-second timeout
      });
      
      // Race the API call against the timeout
      const result = await Promise.race([
        prompt({input: JSON.stringify(input, null, 2)}),
        timeoutPromise
      ]);
      
      // Check if result exists and has expected structure
      if (!result || !result.output || !result.output.profileSummary) {
        throw new Error('Invalid response structure from AI service');
      }
      
      console.log('Successfully generated customer profile');
      return result.output;
    } catch (error: any) {
      console.error(`Profile generation error:`, error);
      
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
        // For any other error, try once more with different parameters
        retryCount++;
        console.warn(`Error during generation. Retrying with simplified input... (Attempt ${retryCount}/${maxRetries})`);
        
        // Simplify input on retry to focus on most important fields
        const simplifiedInput: Record<string, string> = {};
        const keyPriority = ['projectType', 'spaces', 'designStyles', 'budget', 'colorPalette'];
        keyPriority.forEach(key => {
          if (key in input && input[key]) {
            simplifiedInput[key] = input[key];
          }
        });
        
        // Use simplified input if available, otherwise use original
        input = Object.keys(simplifiedInput).length > 0 ? simplifiedInput : input;
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // If we've exhausted all retries, return a basic profile
  console.error('Failed to generate customer profile after multiple retries');
  return {
    profileSummary: 'Client is looking for professional design assistance to transform their space according to their personal style preferences and functional needs. A detailed consultation is recommended to further understand their specific requirements.'
  };
});