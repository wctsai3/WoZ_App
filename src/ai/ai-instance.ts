import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Create AI instance with error handling and retry logic
const createAI = () => {
  // Check for required API keys
  if (!process.env.GOOGLE_GENAI_API_KEY) {
    console.warn('GOOGLE_GENAI_API_KEY is not set. AI generation may fail.');
  }

  try {
    // Initialize genkit with additional configuration
    return genkit({
      promptDir: './prompts',
      plugins: [
        googleAI({
          apiKey: process.env.GOOGLE_GENAI_API_KEY || '',
          options: {
            timeout: 30000, // 30-second timeout
            retry: {
              initialDelay: 1000,
              maxAttempts: 3,
              factor: 2
            },
          }
        }),
      ],
      model: 'googleai/gemini-2.0-flash',
      fallbackHandler: async (error, context) => {
        console.error(`AI error in ${context.operationName}:`, error);
        // Return basic placeholder data based on the context
        if (context.operationName.includes('Profile')) {
          return { profileSummary: 'Client seeking professional design assistance.' };
        } else if (context.operationName.includes('Recommendation')) {
          return { 
            recommendations: [
              { item: 'Design consultation', explanation: 'For customized recommendations.' }
            ] 
          };
        }
        throw error; // Re-throw if we don't have a specific fallback
      }
    });
  } catch (error) {
    console.error('Failed to initialize AI instance:', error);
    // Return a mock AI instance that provides fallback values when real AI fails
    return {
      definePrompt: () => ({
        // Mock prompt function that returns fallback values
        input: async () => ({
          output: {
            profileSummary: 'Design profile unavailable. Please try again later.',
            recommendations: [
              { 
                item: 'Custom design consultation', 
                explanation: 'Our design team will work with you to create a personalized plan.'
              }
            ]
          }
        })
      }),
      defineFlow: (config, handler) => {
        return async (input) => {
          try {
            return await handler(input);
          } catch (e) {
            console.error(`Error in flow ${config.name}:`, e);
            // Return fallback based on flow name
            if (config.name.includes('Profile')) {
              return { profileSummary: 'Client seeking professional design assistance.' };
            } else if (config.name.includes('Recommendation')) {
              return { 
                recommendations: [
                  { item: 'Design consultation', explanation: 'For customized recommendations.' }
                ] 
              };
            }
            throw e;
          }
        };
      }
    };
  }
};

export const ai = createAI();