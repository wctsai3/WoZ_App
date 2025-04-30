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
};

type StateContextType = {
  sessionState: SessionState;
  setSessionState: (state: SessionState) => void;
  setCustomerProfile: (profile: string) => void;
  addFeedback: (content: string, fromUser: boolean) => void;
  addMoodboard: (moodboard: Omit<Moodboard, 'id'>) => void;
  addRecommendation: (recommendation: Omit<Recommendation, 'id'>) => void;
  updateRecommendationImage: (recommendationId: string, imageUrl: string) => void;
  getSessionId: () => string;
};

const generateId = () => Math.random().toString(36).substring(2, 9);
const SESSION_ID = generateId();

const defaultSessionState: SessionState = {
  id: SESSION_ID,
  customerProfile: null,
  recommendations: [],
  feedback: [],
  moodboards: [],
};

const StateContext = createContext<StateContextType | undefined>(undefined);

export function StateProvider({ children }: { children: React.ReactNode }) {
  const [sessionState, _setSessionState] = useState<SessionState>(defaultSessionState);

  
  const setSessionState = (state: SessionState) => {
    _setSessionState(state);
  };


  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionIdFromUrl = new URLSearchParams(window.location.search).get('session');
        if (!sessionIdFromUrl) return;
  
        const res = await fetch(`/api/session?id=${sessionIdFromUrl}`);
        const data = await res.json();
  
        if (data && data.id) {
          setSessionState(data);
        }
      } catch (e) {
        console.error('Failed to load session from Redis', e);
      }
    };
  
    loadSession();
  }, []);
  


  useEffect(() => {
    const saveSession = async () => {
      try {
        await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionState),
        });
      } catch (e) {
        console.error('Failed to save session to Redis', e);
      }
    };

    saveSession();
  }, [sessionState]);

  const setCustomerProfile = (profile: string) => {
    _setSessionState(prev => ({
      ...prev,
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

    _setSessionState(prev => ({
      ...prev,
      feedback: [...prev.feedback, newFeedback],
    }));
  };

  const addMoodboard = (moodboard: Omit<Moodboard, 'id'>) => {
    const newMoodboard: Moodboard = {
      ...moodboard,
      id: generateId(),
    };

    _setSessionState(prev => ({
      ...prev,
      moodboards: [...prev.moodboards, newMoodboard],
    }));
  };

  const addRecommendation = (recommendation: Omit<Recommendation, 'id'>) => {
    const newRecommendation: Recommendation = {
      ...recommendation,
      id: generateId(),
    };

    _setSessionState(prev => ({
      ...prev,
      recommendations: [...prev.recommendations, newRecommendation],
    }));
  };

  const updateRecommendationImage = (recommendationId: string, imageUrl: string) => {
    _setSessionState(prev => ({
      ...prev,
      recommendations: prev.recommendations.map(rec =>
        rec.id === recommendationId ? { ...rec, imageUrl } : rec
      ),
    }));
  };

  const getSessionId = () => sessionState.id;

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
