'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useStateContext } from '@/lib/state-context'; // Ensure this path is correct
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast'; // Ensure this path is correct

const feedbackSchema = z.object({
  content: z.string().min(5, { message: 'Response must be at least 5 characters' }),
});

const moodboardSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  image1: z.string().url({ message: 'Please enter a valid URL for image 1' }),
  image2: z.string().url({ message: 'Please enter a valid URL for image 2' }).optional(),
  image3: z.string().url({ message: 'Please enter a valid URL for image 3' }).optional(),
  image4: z.string().url({ message: 'Please enter a valid URL for image 4' }).optional(),
});

const recommendationImageSchema = z.object({
  imageUrl: z.string().url({ message: 'Please enter a valid image URL' }),
});

export default function WizardDashboardInner() {
  // IMPORTANT: Replace 'loadSessionById' with the actual function from your StateContext
  // that loads/updates the session state based on fetched data.
  const { sessionState, loadSessionById, addFeedback, addMoodboard, updateRecommendationImage } = useStateContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('conversation');
  const [editingRecommendationId, setEditingRecommendationId] = useState<string | null>(null);
  const [activeSessions, setActiveSessions] = useState<{id: string, customerProfile: string, timestamp: number}[]>([]);
  const [sessionSelected, setSessionSelected] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false); // Added for loading state
  const [sessionError, setSessionError] = useState(false); // Added for error tracking

  const feedbackForm = useForm<z.infer<typeof feedbackSchema>>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      content: '',
    },
  });

  const moodboardForm = useForm<z.infer<typeof moodboardSchema>>({
    resolver: zodResolver(moodboardSchema),
    defaultValues: {
      title: '',
      description: '',
      image1: '',
      image2: '',
      image3: '',
      image4: '',
    },
  });

  const imageForm = useForm<z.infer<typeof recommendationImageSchema>>({
    resolver: zodResolver(recommendationImageSchema),
    defaultValues: {
      imageUrl: '',
    },
  });

  // Create a ref for scrolling
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sessionState.feedback]);


  // Fetch list of active sessions for the initial view
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch('/api/sessions');
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          setActiveSessions(
            data.map((s: any) => ({
              id: s.id,
              // Ensure customerProfile exists, provide fallback if necessary
              customerProfile: s.customerProfile || 'Profile not available',
              timestamp: s.timestamp || Date.now(),
            }))
          );
        } else {
           console.error('Fetched sessions data is not an array:', data);
           setActiveSessions([]); // Set to empty array if data is invalid
        }
      } catch (err) {
        console.error('Failed to fetch sessions list', err);
         setActiveSessions([]); // Clear sessions on error
      }
    };

    fetchSessions(); // Fetch immediately on mount
    const interval = setInterval(fetchSessions, 5000); // Refresh list every 5 seconds
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  
  // Load specific session data when URL parameter 'session' changes
  useEffect(() => {
    const sessionId = searchParams.get('session');

    if (sessionId) {
      setSessionSelected(true);
      setIsLoadingSession(true);
      setSessionError(false);

      const fetchSessionData = async () => {
        try {
          console.log(`Fetching session data for ID: ${sessionId}`);
          
          // Add timestamp to prevent caching issues
          const timestamp = Date.now();
          const response = await fetch(`/api/sessions/${sessionId}?_t=${timestamp}`);

          // Check for errors in the response
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to fetch session ${sessionId}: ${response.status}`, errorText);
            setSessionError(true);
            
            // Display appropriate error message
            toast({
              title: 'Error Loading Session',
              description: `Could not load session ${sessionId}. Status: ${response.status}. ${
                response.status === 404 ? 'Session may have been deleted.' : 'Server error occurred.'
              }`,
              variant: 'destructive',
            });
            
            setIsLoadingSession(false);
            return;
          }

          // Parse the response
          let sessionData;
          try {
            sessionData = await response.json();
            console.log('Session data loaded:', sessionData);
          } catch (parseError) {
            console.error(`Error parsing session data for ${sessionId}:`, parseError);
            setSessionError(true);
            toast({
              title: 'Data Error',
              description: 'Could not parse session data. The data may be corrupted.',
              variant: 'destructive',
            });
            setIsLoadingSession(false);
            return;
          }

          // Validate session data - add explicit initialization for missing fields
          if (!sessionData) {
            sessionData = { id: sessionId };
          }
          
          // Ensure all arrays exist to prevent rendering errors
          if (!Array.isArray(sessionData.recommendations)) {
            sessionData.recommendations = [];
          }
          
          if (!Array.isArray(sessionData.feedback)) {
            sessionData.feedback = [];
          }
          
          if (!Array.isArray(sessionData.moodboards)) {
            sessionData.moodboards = [];
          }
          
          // Ensure the ID exists
          if (!sessionData.id) {
            sessionData.id = sessionId;
          }

          console.log(`Successfully loaded session ${sessionId}`);
          
          // Update the context with the fetched data
          if (typeof loadSessionById === 'function') {
            loadSessionById(sessionData);
          } else {
            console.error("StateContext is missing the loadSessionById function!");
            setSessionError(true);
            toast({
              title: 'Application Error',
              description: 'Could not process session data due to a missing function.',
              variant: 'destructive',
            });
            setIsLoadingSession(false);
            return;
          }
          
          setIsLoadingSession(false);
        } catch (error) {
          console.error(`Network error fetching session ${sessionId}:`, error);
          setSessionError(true);
          toast({
            title: 'Network Error',
            description: `Failed to connect to server to load session ${sessionId}.`,
            variant: 'destructive',
          });
          setIsLoadingSession(false);
        }
      };

      // Add a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (isLoadingSession) {
          console.warn(`Session loading timed out for session ${sessionId}`);
          setIsLoadingSession(false);
          setSessionError(true);
          toast({
            title: 'Loading Timeout',
            description: 'Session data loading took too long. Please try again.',
            variant: 'destructive',
          });
        }
      }, 15000); // 15-second timeout

      fetchSessionData();

      // Clear timeout if component unmounts or dependencies change
      return () => clearTimeout(timeoutId);
    } else {
      // Reset state if no session ID in URL
      setSessionSelected(false);
      setSessionError(false);
    }
  }, [searchParams, loadSessionById, toast, isLoadingSession]);


  // Update the polling mechanism in wizard-dashboard-inner.tsx

  // Poller for real-time updates from the server
  useEffect(() => {
    const sessionId = searchParams.get('session');
    
    // Don't start polling if no session ID or if still loading the initial data
    if (!sessionId || isLoadingSession) {
      return;
    }

    console.log(`Starting polling for session ${sessionId}`);
    
    let failedAttempts = 0;
    const MAX_FAILED_ATTEMPTS = 5;
    
    const pollSession = async () => {
      try {
        // Add timestamp to prevent caching issues
        const timestamp = Date.now();
        const res = await fetch(`/api/sessions/${sessionId}?_t=${timestamp}`);

        if (!res.ok) {
          failedAttempts++;
          console.warn(`Polling error (attempt ${failedAttempts}/${MAX_FAILED_ATTEMPTS}): Status ${res.status}`);
          
          // Stop polling after too many failed attempts
          if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
            console.error(`Stopping polling after ${MAX_FAILED_ATTEMPTS} failed attempts`);
            clearInterval(intervalId);
            
            // Only show toast on first failure that reaches the threshold
            if (failedAttempts === MAX_FAILED_ATTEMPTS) {
              toast({
                title: 'Connection Issues',
                description: 'Having trouble connecting to the server. Updates may be delayed.',
                variant: 'destructive',
              });
            }
          }
          return;
        }

        // Reset failure counter on success
        failedAttempts = 0;

        const latestSessionData = await res.json();

        if (!latestSessionData?.id) {
          console.warn(`Polling: Invalid data received for session ${sessionId}`);
          return;
        }

        // Compare with current state to check for updates
        const current = sessionState;
        const hasNewFeedback = (latestSessionData.feedback?.length || 0) > (current.feedback?.length || 0);
        const hasNewMoodboard = (latestSessionData.moodboards?.length || 0) > (current.moodboards?.length || 0);
        const hasNewRecommendations = (latestSessionData.recommendations?.length || 0) > (current.recommendations?.length || 0);
        const hasUpdatedImages = false;
        
        // Check for updated recommendation images
        if (latestSessionData.recommendations && current.recommendations) {
          for (const newRec of latestSessionData.recommendations) {
            const matchingRec = current.recommendations.find(r => r.id === newRec.id);
            if (matchingRec && newRec.imageUrl && newRec.imageUrl !== matchingRec.imageUrl) {
              hasUpdatedImages = true;
              break;
            }
          }
        }

        // Update state if changes detected
        if (hasNewFeedback || hasNewMoodboard || hasNewRecommendations || hasUpdatedImages) {
          console.log(`Polling: Detected updates for session ${sessionId}`);
          
          // Ensure necessary arrays exist before updating state
          if (!Array.isArray(latestSessionData.recommendations)) {
            latestSessionData.recommendations = [];
          }
          
          if (!Array.isArray(latestSessionData.feedback)) {
            latestSessionData.feedback = [];
          }
          
          if (!Array.isArray(latestSessionData.moodboards)) {
            latestSessionData.moodboards = [];
          }
          
          // Update state using loadSessionById function
          if (typeof loadSessionById === 'function') {
            loadSessionById(latestSessionData);
          } else {
            console.error("Context is missing 'loadSessionById' function");
          }
        }
      } catch (e) {
        failedAttempts++;
        console.error(`Polling error (attempt ${failedAttempts}/${MAX_FAILED_ATTEMPTS}):`, e);
        
        // Stop polling after too many failed attempts
        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
          console.error(`Stopping polling after ${MAX_FAILED_ATTEMPTS} failed attempts`);
          clearInterval(intervalId);
        }
      }
    };

    // Execute immediately on mount
    pollSession();
    
    // Then set up interval
    const intervalId = setInterval(pollSession, 5000); // Poll every 5 seconds
    
    // Cleanup interval on unmount or when dependencies change
    return () => {
      console.log(`Stopping polling for session ${sessionId}`);
      clearInterval(intervalId);
    };
  }, [searchParams, loadSessionById, sessionState, isLoadingSession, toast]);

  // Handlers for forms
  const submitFeedback = async (values: z.infer<typeof feedbackSchema>) => {
    try {
      addFeedback(values.content, false);
      feedbackForm.reset();
      toast({
        title: 'Response sent',
        description: 'Your response has been sent to the user.',
      });
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: 'Error',
        description: 'Failed to send your response.',
        variant: 'destructive',
      });
    }
  };

  const submitMoodboard = async (values: z.infer<typeof moodboardSchema>) => {
    try {
      const images = [
        values.image1,
        ...(values.image2 ? [values.image2] : []),
        ...(values.image3 ? [values.image3] : []),
        ...(values.image4 ? [values.image4] : []),
      ];

      addMoodboard({
        title: values.title,
        description: values.description,
        images,
        createdBy: 'wizard',
      });

      moodboardForm.reset();

      toast({
        title: 'Moodboard created',
        description: "The moodboard has been added to the user's view.",
      });
    } catch (error) {
      console.error('Error creating moodboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to create the moodboard.',
        variant: 'destructive',
      });
    }
  };

  const submitRecommendationImage = async (values: z.infer<typeof recommendationImageSchema>) => {
    if (!editingRecommendationId) return;

    try {
      updateRecommendationImage(editingRecommendationId, values.imageUrl);
      imageForm.reset();
      setEditingRecommendationId(null);

      toast({
        title: 'Image added',
        description: 'The image has been added to the recommendation.',
      });
    } catch (error) {
      console.error('Error adding image:', error);
      toast({
        title: 'Error',
        description: 'Failed to add the image.',
        variant: 'destructive',
      });
    }
  };

  // Destructure state *after* potential updates from useEffect
  const { customerProfile, recommendations, feedback, moodboards } = sessionState;


  // --- Conditional Rendering Logic ---

  // Case 1: No session selected via URL -> Show Session List
  if (!sessionSelected) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Design Wizard Dashboard</h1>

        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>
              {activeSessions.length > 0
                ? "Select a session to manage"
                : "Waiting for a user to complete the questionnaire"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeSessions.length > 0 ? (
              <div className="space-y-4">
                {activeSessions.map(session => (
                  <Card key={session.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Active Design Session</CardTitle>
                      <CardDescription>
                        Created {new Date(session.timestamp).toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <ScrollArea className="h-40 pr-4 rounded-md border p-2">
                        <p className="text-sm">
                          {session.customerProfile ? session.customerProfile.substring(0, 300) + '...' : 'No profile summary available.'}
                        </p>
                      </ScrollArea>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        onClick={() => {
                          // Navigate to the specific session page
                          router.push(`/wizard?session=${session.id}`);
                          // Note: setSessionSelected(true) will happen naturally via useEffect when URL changes
                        }}
                      >
                        Manage Session
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No active sessions found.
                </p>
                <p className="text-muted-foreground mt-2">
                  This page will automatically refresh.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Case 2: Session selected via URL, but currently loading data
  if (isLoadingSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-6">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Loading Session</CardTitle>
            <CardDescription>
              Retrieving session data...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={() => router.push('/wizard')}>
              Return to Sessions List
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Case 3: Session selected, but loading failed OR loaded data is invalid
  if (sessionError || !sessionState.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Cannot Load Session</CardTitle>
            <CardDescription>
              {sessionError
                ? "Failed to load session data. The session might not exist or there was a server error."
                : "Session data loaded, but it seems incomplete. Please ensure the user finished the questionnaire."}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/wizard')} className="w-full">Return to Sessions List</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Case 4: Session selected, loading complete, data is valid -> Show Full Dashboard
  // Safely access session data, providing fallbacks for missing values
  const customerProfile = sessionState.customerProfile || 'No customer profile available.';
  const recommendations = Array.isArray(sessionState.recommendations) ? sessionState.recommendations : [];
  const feedback = Array.isArray(sessionState.feedback) ? sessionState.feedback : [];
  const moodboards = Array.isArray(sessionState.moodboards) ? sessionState.moodboards : [];

  return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Design Wizard Dashboard</h1>
          <Button variant="outline" onClick={() => router.push('/wizard')}>
            Return to Sessions List
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customer">Customer Profile</TabsTrigger>
            <TabsTrigger value="conversation">Conversation</TabsTrigger>
            <TabsTrigger value="design">Design Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="customer" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Profile</CardTitle>
                <CardDescription>Based on questionnaire responses</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[60vh] pr-4">
                  <p className="whitespace-pre-line">{customerProfile}</p>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conversation" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversation with Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[50vh] pr-4">
                  <div className="space-y-4">
                    {feedback.length > 0 ? (
                      feedback.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "p-4 rounded-lg",
                            message.fromUser
                              ? "bg-secondary/10 mr-8" // Customer message styling
                              : "bg-primary/10 ml-8"   // Wizard message styling
                          )}
                        >
                          <p className="text-sm font-medium mb-1">
                            {message.fromUser ? 'Customer' : 'You (Design Team)'}
                          </p>
                          <p>{message.content}</p>
                          <p className="text-xs text-muted-foreground text-right mt-1">
                            {new Date(message.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground">No conversation yet.</p>
                    )}
                  </div>
                  <div ref={chatEndRef} />
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <Form {...feedbackForm}>
                  <form onSubmit={feedbackForm.handleSubmit(submitFeedback)} className="w-full space-y-2">
                    <FormField
                      control={feedbackForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Response</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Type your response to the customer..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">Send Response</Button>
                  </form>
                </Form>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="design" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Moodboard Creation Form */}
              <div className="md:col-span-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Create Moodboard</CardTitle>
                    <CardDescription>Add a new moodboard for the customer</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...moodboardForm}>
                      <form onSubmit={moodboardForm.handleSubmit(submitMoodboard)} className="space-y-4">
                        <FormField control={moodboardForm.control} name="title" render={({ field }) => ( <FormItem> <FormLabel>Moodboard Title</FormLabel> <FormControl> <Input placeholder="Enter a title..." {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                        <FormField control={moodboardForm.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Description</FormLabel> <FormControl> <Textarea placeholder="Describe this moodboard..." className="min-h-[80px]" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                        <div className="grid grid-cols-1 gap-4">
                          <FormField control={moodboardForm.control} name="image1" render={({ field }) => ( <FormItem> <FormLabel>Image 1 URL (required)</FormLabel> <FormControl> <Input placeholder="https://..." {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                          <FormField control={moodboardForm.control} name="image2" render={({ field }) => ( <FormItem> <FormLabel>Image 2 URL (optional)</FormLabel> <FormControl> <Input placeholder="https://..." {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                          <FormField control={moodboardForm.control} name="image3" render={({ field }) => ( <FormItem> <FormLabel>Image 3 URL (optional)</FormLabel> <FormControl> <Input placeholder="https://..." {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                          <FormField control={moodboardForm.control} name="image4" render={({ field }) => ( <FormItem> <FormLabel>Image 4 URL (optional)</FormLabel> <FormControl> <Input placeholder="https://..." {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                        </div>
                        <Button type="submit" className="w-full">Create Moodboard</Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations Image Adder */}
              <div className="md:col-span-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                    <CardDescription>Add images to generated recommendations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[50vh] pr-4">
                      <div className="space-y-4">
                        {recommendations.length > 0 ? (
                          recommendations.map((recommendation) => (
                            <Card key={recommendation.id} className="overflow-hidden">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg">{recommendation.item}</CardTitle>
                              </CardHeader>
                              <CardContent className="pb-2">
                                <p className="text-sm mb-3">{recommendation.explanation}</p>
                                {recommendation.imageUrl ? (
                                  <div>
                                    <img
                                      src={recommendation.imageUrl}
                                      alt={recommendation.item}
                                      className="w-full h-36 object-cover rounded-md"
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="mt-2 w-full"
                                      onClick={() => {
                                        setEditingRecommendationId(recommendation.id);
                                        imageForm.setValue('imageUrl', recommendation.imageUrl || '');
                                      }}
                                    >
                                      Change Image
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setEditingRecommendationId(recommendation.id)}
                                  >
                                    Add Image
                                  </Button>
                                )}
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground">No recommendations available yet.</p>
                        )}
                      </div>
                    </ScrollArea>

                    {/* Image adding/editing form */}
                    {editingRecommendationId && (
                      <div className="mt-4 p-4 border rounded-md">
                        <h3 className="text-sm font-medium mb-2">
                          Add/Change Image for {recommendations.find(r => r.id === editingRecommendationId)?.item || 'Recommendation'}
                        </h3>
                        <Form {...imageForm}>
                          <form onSubmit={imageForm.handleSubmit(submitRecommendationImage)} className="space-y-2">
                            <FormField
                              control={imageForm.control}
                              name="imageUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Enter image URL..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex gap-2">
                              <Button type="submit" size="sm">Save</Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingRecommendationId(null);
                                  imageForm.reset();
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Button to open user view (optional) */}
        <div className="fixed bottom-4 right-4">
          <Button onClick={() => window.open(`/moodboards?session=${sessionState.id}`, '_blank')} variant="secondary">
            Open User View
          </Button>
        </div>
      </div>
  );
}