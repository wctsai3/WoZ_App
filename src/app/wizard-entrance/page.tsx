'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

type SessionInfo = {
  id: string;
  customerProfile: string | null;
  timestamp: number;
};

export default function WizardEntrancePage() {
  const router = useRouter();
  const [activeSessions, setActiveSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for any active sessions
    const checkForSessions = () => {
      setLoading(true);
      try {
        // Get all localStorage keys
        const keys = Object.keys(localStorage);
        
        // Filter for session state keys (they start with woz_session_state)
        const sessionKeys = keys.filter(key => key.startsWith('woz_session_state'));
        
        // Parse each session state
        const sessions: SessionInfo[] = [];
        
        sessionKeys.forEach(key => {
          try {
            const sessionData = JSON.parse(localStorage.getItem(key) || '{}');
            if (sessionData.customerProfile) {
              sessions.push({
                id: sessionData.id,
                customerProfile: sessionData.customerProfile,
                timestamp: Date.now() // Use current time as we don't store when the session was created
              });
            }
          } catch (e) {
            console.error('Failed to parse session data:', e);
          }
        });
        
        setActiveSessions(sessions);
      } catch (e) {
        console.error('Failed to check for sessions:', e);
      } finally {
        setLoading(false);
      }
    };

    // Check initially
    checkForSessions();
    
    // Set up an interval to poll for new sessions
    const interval = setInterval(checkForSessions, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const goToWizardDashboard = (sessionId: string) => {
    router.push(`/wizard?session=${sessionId}`);
  };

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Design Genie</h1>
        <p className="text-xl text-muted-foreground">Wizard Control Panel</p>
      </div>

      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Active Sessions</h2>
        
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : activeSessions.length > 0 ? (
          <div className="grid gap-6">
            {activeSessions.map(session => (
              <Card key={session.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Customer Session</CardTitle>
                  <CardDescription>ID: {session.id}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="line-clamp-4 text-sm text-muted-foreground mb-4">
                    {session.customerProfile}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => goToWizardDashboard(session.id)}
                    className="w-full"
                  >
                    Enter Wizard Dashboard
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                There are currently no active customer sessions. Sessions will appear here when customers complete the questionnaire.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                Refresh
              </Button>
            </CardFooter>
          </Card>
        )}

        <div className="mt-12 text-center">
          <Button variant="outline" onClick={() => router.push('/')}>
            Go to Home Page
          </Button>
        </div>
      </div>
    </div>
  );
} 