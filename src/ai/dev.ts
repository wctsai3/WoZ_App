// Enhanced development mode implementation with fallbacks
// This provides reliable responses when AI services are unavailable

import '@/ai/flows/design-recommendation-output.ts';
import '@/ai/flows/customer-profile-generation.ts';

// Fallback profiles for development and error recovery
export const fallbackProfiles = {
  minimalProfile: `Customer is interested in a modern aesthetic for their living space. They prefer neutral tones with occasional bold accents. The space should be functional and comfortable for daily living.`,
  
  standardProfile: `Customer Profile: Design Project

Design Style & Preferences:
The client is interested in a modern minimalist design aesthetic for their living room. They prefer a color palette centered around neutral tones with occasional blue accents and want to avoid overly bright colors. Their ideal space is described as "comfortable yet stylish" with an emphasis on natural materials and textures.

Functional Needs:
The space is primarily used by a family of four for relaxation and occasional entertaining. Key requirements include adequate seating, storage solutions, and consideration for a home entertainment system.

Current Situation:
The client appreciates the natural light in their current space but is dissatisfied with the outdated fixtures and inefficient layout. They plan to keep their bookshelf and art collection and wish to add new seating and lighting elements.

Technical Considerations:
The project involves a renovation with approximately 400 square feet and a moderate budget. Notable architectural features include large windows and a fireplace that will need to be incorporated into the design.

Additional Notes:
The client values sustainability and locally sourced materials where possible. They have expressed interest in smart home integration for lighting and entertainment systems.`,

  comprehensiveProfile: `Client Profile: Modern Family Home Redesign

Design Style & Aesthetic Preferences:
The clients, a family of four, are drawn to a balanced blend of modern and mid-century design elements. They favor clean lines and uncluttered spaces without feeling sterile or impersonal. Their color preferences center around a warm neutral base palette (soft whites, taupes, and light woods) with strategic pops of deep blue and terracotta as accent colors. They specifically mentioned avoiding trendy design elements that might quickly feel dated, as well as overly bright or neon colors that could feel too stimulating in their home environment.

Materials & Textures:
The clients expressed strong interest in incorporating natural materials throughout their space, particularly wood, stone, and various textiles. They appreciate the warmth of oak and walnut, the texture of natural stone, and the softness of linen and cotton. They are open to incorporating metal accents in brass or matte black but wish to avoid chrome or highly reflective surfaces.

Functional Requirements:
As a family with two school-aged children (ages 8 and 10), functionality is paramount. Their home needs to accommodate homework sessions, family gatherings, occasional entertaining of 8-10 guests, and storage for various activities and hobbies. Both parents work from home part-time and require dedicated workspace areas that can be integrated into the overall design without feeling isolated.`
};

// Fallback recommendations for development and error recovery
export const fallbackRecommendations = {
  minimalRecommendations: [
    {
      item: "Modular sectional sofa in light gray",
      explanation: "A versatile seating solution that adapts to your family's needs while maintaining a clean, modern aesthetic."
    },
    {
      item: "Integrated smart lighting system",
      explanation: "Programmable lighting to create different moods while enhancing functionality for various activities."
    },
    {
      item: "Natural oak floating shelves",
      explanation: "Provides display and storage space while incorporating the warm, natural materials you prefer."
    }
  ],
  
  standardRecommendations: [
    {
      item: "Modular sectional sofa in light gray bouclé fabric",
      explanation: "This versatile seating solution adapts to your family's daily needs while accommodating guests during entertainment. The light gray color maintains your neutral palette while the bouclé texture adds warmth and durability for family use."
    },
    {
      item: "Walnut and brass floor lamp with adjustable arm",
      explanation: "This lighting element combines your preferred natural wood with subtle metal accents. The adjustable nature provides both ambient lighting for relaxation and focused task lighting for reading or activities."
    },
    {
      item: "Custom built-in storage surrounding the fireplace",
      explanation: "Maximizes functionality by incorporating storage for your book collection and entertainment components while making the fireplace a central design feature. The custom approach ensures proper scale for your specific space."
    },
    {
      item: "Indoor plants with textured ceramic planters",
      explanation: "Introduces natural elements and softens the modern aesthetic with organic shapes. The textured planters add visual interest and complement your desire for varied textures throughout the space."
    },
    {
      item: "Smart home integration hub with voice control",
      explanation: "Fulfills your interest in technology integration while maintaining a clean aesthetic by reducing visible controls. Can manage lighting, sound, and climate control through a single, discreet system."
    }
  ],
  
  comprehensive: [
    {
      item: "Custom modular storage system in walnut and white",
      explanation: "This bespoke solution addresses multiple functional needs: providing display space for your art collection, closed storage for children's items, and integrated workspace areas that can be concealed when not in use. The materiality combines your preference for warm wood tones with clean modern lines."
    },
    {
      item: "Layered lighting plan with smart controls",
      explanation: "A comprehensive approach combining recessed ceiling fixtures, adjustable reading lamps, indirect lighting, and statement pendants. All lighting will be integrated with a smart home system allowing you to program specific scenes for different activities from homework time to entertaining."
    },
    {
      item: "Performance fabric sectional in oatmeal with terracotta accent pillows",
      explanation: "Centered around your family's needs for comfort and durability while maintaining sophistication. The neutral base provides versatility, while accent pillows introduce your desired color pops. The performance fabric specifically addresses concerns about active children and longevity."
    },
    {
      item: "Multi-functional ottoman/coffee table with integrated storage",
      explanation: "This piece transforms from coffee table to extra seating when entertaining, while providing hidden storage for games and children's items. The design incorporates wood and fabric elements to add textural interest to the space."
    },
    {
      item: "Acoustic wall treatment in natural materials",
      explanation: "Addresses sound issues in the open plan space without compromising aesthetics. Using natural fibers and wood elements, these panels improve conversation quality during gatherings while adding visual texture and warmth to walls."
    }
  ]
};

// Development implementation of AI services
export const dev = {
  // Text generation function that provides reliable fallbacks
  async generateText(prompt: string): Promise<string> {
    console.log('Dev mode text generation triggered');
    
    // Add artificial delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      // Based on prompt content, provide appropriate responses
      if (prompt.includes('customer profile') || prompt.includes('questionnaire')) {
        // For profile generation
        return JSON.stringify({
          profileSummary: fallbackProfiles.standardProfile
        });
      } 
      else if (prompt.includes('design recommendation') || prompt.includes('recommendations')) {
        // For recommendation generation
        return JSON.stringify({
          recommendations: fallbackRecommendations.standardRecommendations
        });
      }
      
      // Default response if prompt doesn't match known patterns
      return JSON.stringify({
        message: "Development mode response provided. The AI service is currently in development mode."
      });
    } catch (error) {
      console.error('Error in development text generation:', error);
      
      // Even if our fallback logic fails, provide the most basic response
      return JSON.stringify({
        profileSummary: fallbackProfiles.minimalProfile,
        recommendations: fallbackRecommendations.minimalRecommendations
      });
    }
  }
};