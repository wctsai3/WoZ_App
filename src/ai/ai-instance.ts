// Browser-compatible AI instance mock
// This avoids Node.js dependencies that cause build issues in Vercel

// Simple mock implementation for Genkit
const mockGenkit = {
  definePrompt: (config: any) => {
    return async (input: any) => {
      console.log('Mock prompt called with:', input);
      return {
        output: {
          // Return mock data based on the prompt name
          profileSummary: config.name === 'customerProfilePrompt' 
            ? "This customer prefers modern design with clean lines and a neutral color palette. They have a moderate budget and prioritize functional, comfortable spaces for their family. They specifically mentioned enjoying Scandinavian design elements and want to incorporate natural materials like wood and wool." 
            : undefined,
          recommendations: config.name === 'designRecommendationPrompt'
            ? [
                {
                  item: "Neutral Sectional Sofa",
                  explanation: "A comfortable sectional in a neutral tone provides ample seating for family gatherings while maintaining the clean aesthetic you prefer. The modular design offers flexibility for your space."
                },
                {
                  item: "Natural Wood Coffee Table",
                  explanation: "A simple wood coffee table brings warmth to your living space while showcasing the natural materials you love from Scandinavian design."
                },
                {
                  item: "Textured Area Rug",
                  explanation: "A wool rug with subtle texture adds warmth and comfort underfoot while defining the seating area in your open concept space."
                },
                {
                  item: "Adjustable Floor Lamp",
                  explanation: "An adjustable lamp provides functional lighting for reading or working while adding a modern sculptural element to your room."
                },
                {
                  item: "Wall-mounted Shelving System",
                  explanation: "Floating wood shelves offer both storage and display space, keeping the look clean and minimal while showcasing your personal items."
                }
              ]
            : undefined,
          imageUrl: config.name === 'moodboardPrompt'
            ? 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bW9kZXJuJTIwaW50ZXJpb3J8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60'
            : undefined
        }
      };
    };
  },
  defineFlow: <T, U>(config: any, handler: any) => {
    // Simply return the handler function
    return handler;
  }
};

// Export a mock AI instance
export const ai = mockGenkit;
