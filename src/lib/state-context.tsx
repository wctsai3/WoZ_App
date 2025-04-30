'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Define Types (keep these as they are)
type Feedback = {
  id: string;
  content: string;
  fromUser: boolean;
  timestamp: number;
};

type Moodboard = {
  id: string;
  title: string;
  description: string;
  images: string[];
  createdBy: 'wizard' | 'ai';
};

type Recommendation = {
  id: string;
  item: string;
  explanation: string;
  imageUrl?: string;
};

type SessionState = {
  id: string; // Can be empty string or null initially
  customerProfile: string | null;
  recommendations: Recommendation[];
  feedback: Feedback[];
  moodboards: Moodboard[];
};

// Define Context Type
type StateContextType = {
  sessionState: SessionState;
  setSessionState: (state: SessionState) => void;
  setCustomerProfile: (profile: string, sessionId: string) => void;
  addFeedback: (content: string, fromUser: boolean) => void;
  addMoodboard: (moodboard: Omit<Moodboard, 'id'>) => void;
  addRecommendation: (recommendation: Omit<Recommendation, 'id'>) => void;
  updateRecommendationImage: (recommendationId: string, imageUrl: string) => void;
  getSessionId: () => string;
  loadSessionById: (sessionData: SessionState) => void; // Added this function
};

// Utility function (keep as is)
const generateId = () => Math.random().toString(36).substring(2, 9);

// --- FIXED: Correct Default State ---
const defaultSessionState: SessionState = {
  id: '', // Initialize with empty string
  customerProfile: null,
  recommendations: [],
  feedback: [],
  moodboards: [],
};

const StateContext = createContext<StateContextType | undefined>(undefined);

export function StateProvider({ children }: { children: React.ReactNode }) {
  // Initialize state with the corrected default
  const [sessionState, _setSessionState] = useState<SessionState>(defaultSessionState);

  // Function to update the entire state
  const setSessionState = (state: SessionState) => {
    console.log("Setting full session state:", state);
    _setSessionState(state);
    
    // Persist to server if we have a valid session ID
    if (state.id) {
      persistSessionToServer(state.id, state);
    }
  };
  
  // Added function to load session by ID
  const loadSessionById = (sessionData: SessionState) => {
    console.log("Loading session data:", sessionData);
    _setSessionState(sessionData);
  };
  
  // Helper function to persist session data to server
  const persistSessionToServer = async (sessionId: string, data: SessionState) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        console.error(`Failed to persist session: ${response.status}`);
      }
    } catch (error) {
      console.error('Error persisting session:', error);
    }
  };

  // Effect to load existing session data from URL on initial mount
  useEffect(() => {
    const loadSession = async () => {
      let sessionIdFromUrl: string | null = null;
      try {
        // Ensure this runs only client-side
        if (typeof window !== 'undefined') {
             sessionIdFromUrl = new URLSearchParams(window.location.search).get('session');
        }

        if (!sessionIdFromUrl) {
          console.log("No session ID in URL to load.");
          // Reset to default state if no session specified
           _setSessionState(defaultSessionState);
          return;
        }

        console.log(`Loading session from URL: ${sessionIdFromUrl}`);
        const res = await fetch(`/api/sessions/${sessionIdFromUrl}`);

        if (!res.ok) {
          if (res.status === 404) {
            console.warn(`Session ${sessionIdFromUrl} not found.`);
             _setSessionState({...defaultSessionState, id: '' }); // Reset state
          } else {
            throw new Error(`Failed to fetch session: ${res.status}`);
          }
          return;
        }

        const data = await res.json();

        if (data && data.id) {
          console.log("Session data loaded successfully:", data);
          _setSessionState(data); // Load the fetched state
        } else {
          console.warn("Loaded session data is invalid", data);
           _setSessionState({...defaultSessionState, id: '' }); // Reset if data invalid
        }
      } catch (e) {
        console.error('Failed to load session:', e);
         _setSessionState({...defaultSessionState, id: '' }); // Reset on error
      }
    };

    loadSession();
  }, []); // Run only once on mount

  // Function implementations
  const setCustomerProfile = (profile: string, sessionId: string) => {
    _setSessionState(prev => {
      const updatedState = {
        ...prev,
        id: sessionId, // Ensure the correct ID is set
        customerProfile: profile,
      };
      
      // Persist updated state
      persistSessionToServer(sessionId, updatedState);
      
      return updatedState;
    });
  };

  const addFeedback = (content: string, fromUser: boolean) => {
    const newFeedback: Feedback = {
      id: generateId(),
      content,
      fromUser,
      timestamp: Date.now(),
    };
    
    _setSessionState(prev => {
      const updatedState = {
        ...prev,
        feedback: [...(prev.feedback || []), newFeedback],
      };
      
      // Persist if we have a session ID
      if (prev.id) {
        persistSessionToServer(prev.id, updatedState);
      }
      
      return updatedState;
    });
  };

  const addMoodboard = (moodboard: Omit<Moodboard, 'id'>) => {
    const newMoodboard: Moodboard = {
      ...moodboard,
      id: generateId(),
    };
    
    _setSessionState(prev => {
      const updatedState = {
        ...prev,
        moodboards: [...(prev.moodboards || []), newMoodboard],
      };
      
      // Persist if we have a session ID
      if (prev.id) {
        persistSessionToServer(prev.id, updatedState);
      }
      
      return updatedState;
    });
  };

  const addRecommendation = (recommendation: Omit<Recommendation, 'id'>) => {
    const newRecommendation: Recommendation = {
      ...recommendation,
      id: generateId(),
    };
    
    _setSessionState(prev => {
      const updatedState = {
        ...prev,
        recommendations: [...(prev.recommendations || []), newRecommendation],
      };
      
      // Persist if we have a session ID
      if (prev.id) {
        persistSessionToServer(prev.id, updatedState);
      }
      
      return updatedState;
    });
  };

  const updateRecommendationImage = (recommendationId: string, imageUrl: string) => {
    _setSessionState(prev => {
      const updatedState = {
        ...prev,
        recommendations: (prev.recommendations || []).map(rec =>
          rec.id === recommendationId ? { ...rec, imageUrl } : rec
        ),
      };
      
      // Persist if we have a session ID
      if (prev.id) {
        persistSessionToServer(prev.id, updatedState);
      }
      
      return updatedState;
    });
  };

  // Function to get the current session ID
  const getSessionId = () => sessionState.id;

  // Provide context value
  return (
    <StateContext.Provider
      value={{
        sessionState,
        setSessionState,
        setCustomerProfile,
        addFeedback,
        addMoodboard,
        addRecommendation,
        updateRecommendationImage,
        getSessionId,
        loadSessionById, // Added this function to the context
      }}
    >
      {children}
    </StateContext.Provider>
  );
}

// Hook to use the context (keep as is)
export function useStateContext() {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error('useStateContext must be used within a StateProvider');
  }
  return context;
}