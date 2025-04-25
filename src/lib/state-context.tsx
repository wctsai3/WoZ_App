'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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
  id: string;
  customerProfile: string | null;
  recommendations: Recommendation[];
  feedback: Feedback[];
  moodboards: Moodboard[];
  lastUpdated: number;
};

type StateContextType = {
  sessionState: SessionState;
  setCustomerProfile: (profile: string) => void;
  addFeedback: (content: string, fromUser: boolean) => void;
  addMoodboard: (moodboard: Omit<Moodboard, 'id'>) => void;
  addRecommendation: (recommendation: Omit<Recommendation, 'id'>) => void;
  updateRecommendationImage: (recommendationId: string, imageUrl: string) => void;
  getSessionId: () => string;
  loadSession: (sessionId: string) => void;
};

// Generate a simple unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Create a session ID for this session
const SESSION_ID = generateId();

const createDefaultState = (id: string): SessionState => ({
  id,
  customerProfile: null,
  recommendations: [],
  feedback: [],
  moodboards: [],
  lastUpdated: Date.now(),
});

const defaultSessionState: SessionState = createDefaultState(SESSION_ID);

const STATE_STORAGE_PREFIX = 'woz_session_state';

const StateContext = createContext<StateContextType | undefined>(undefined);

export function StateProvider({ children }: { children: React.ReactNode }) {
  const [sessionState, setSessionState] = useState<SessionState>(defaultSessionState);
  const [currentSessionId, setCurrentSessionId] = useState<string>(SESSION_ID);

  // Create a key for session storage
  const getStorageKey = (id: string) => `${STATE_STORAGE_PREFIX}_${id}`;

  // Load session on first load or when the session ID changes
  useEffect(() => {
    const loadSessionFromStorage = (id: string) => {
      const storageKey = getStorageKey(id);
      const savedState = localStorage.getItem(storageKey);
      
      if (savedState) {
        try {
          setSessionState(JSON.parse(savedState));
        } catch (e) {
          console.error('Failed to parse saved state', e);
          setSessionState(createDefaultState(id));
        }
      } else {
        // If no session exists, create a new default state with this ID
        setSessionState(createDefaultState(id));
      }
    };
    
    loadSessionFromStorage(currentSessionId);
    
    // Set up storage event listener to detect changes from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === getStorageKey(currentSessionId) && event.newValue) {
        try {
          const newState = JSON.parse(event.newValue);
          // Only update if the data is newer
          if (newState.lastUpdated > sessionState.lastUpdated) {
            setSessionState(newState);
          }
        } catch (error) {
          console.error('Error parsing storage change:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Setup polling to check for updates regularly
    const pollInterval = setInterval(() => {
      const storageKey = getStorageKey(currentSessionId);
      const currentData = localStorage.getItem(storageKey);
      
      if (currentData) {
        try {
          const parsedData = JSON.parse(currentData);
          // Only update if the data is newer
          if (parsedData.lastUpdated > sessionState.lastUpdated) {
            setSessionState(parsedData);
          }
        } catch (error) {
          console.error('Error polling for updates:', error);
        }
      }
    }, 1000); // Poll every second
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [currentSessionId, sessionState.lastUpdated]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (sessionState.id) {
      const storageKey = getStorageKey(sessionState.id);
      localStorage.setItem(storageKey, JSON.stringify(sessionState));
    }
  }, [sessionState]);

  const updateSessionState = (
    updater: (prevState: SessionState) => Partial<SessionState>
  ) => {
    setSessionState(prevState => ({
      ...prevState,
      ...updater(prevState),
      lastUpdated: Date.now(),
    }));
  };

  const setCustomerProfile = (profile: string) => {
    updateSessionState(() => ({
      customerProfile: profile,
    }));
  };

  const addFeedback = (content: string, fromUser: boolean) => {
    const newFeedback: Feedback = {
      id: generateId(),
      content,
      fromUser,
      timestamp: Date.now(),
    };

    updateSessionState(prevState => ({
      feedback: [...prevState.feedback, newFeedback],
    }));
  };

  const addMoodboard = (moodboard: Omit<Moodboard, 'id'>) => {
    const newMoodboard: Moodboard = {
      ...moodboard,
      id: generateId(),
    };

    updateSessionState(prevState => ({
      moodboards: [...prevState.moodboards, newMoodboard],
    }));
  };

  const addRecommendation = (recommendation: Omit<Recommendation, 'id'>) => {
    const newRecommendation: Recommendation = {
      ...recommendation,
      id: generateId(),
    };

    updateSessionState(prevState => ({
      recommendations: [...prevState.recommendations, newRecommendation],
    }));
  };

  const updateRecommendationImage = (recommendationId: string, imageUrl: string) => {
    updateSessionState(prevState => ({
      recommendations: prevState.recommendations.map(rec => 
        rec.id === recommendationId 
          ? { ...rec, imageUrl } 
          : rec
      ),
    }));
  };

  const getSessionId = () => sessionState.id;

  // Function to load a specific session by ID
  const loadSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  return (
    <StateContext.Provider
      value={{
        sessionState,
        setCustomerProfile,
        addFeedback,
        addMoodboard,
        addRecommendation,
        updateRecommendationImage,
        getSessionId,
        loadSession,
      }}
    >
      {children}
    </StateContext.Provider>
  );
}

export function useStateContext() {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error('useStateContext must be used within a StateProvider');
  }
  return context;
} 