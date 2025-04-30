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
          const response = await fetch(`/api/sessions/${sessionId}`);

          if (!response.ok) {
            console.error(`Failed to fetch session ${sessionId}: ${response.status}`);
            setSessionError(true);
            if (typeof loadSessionById === 'function') {
                // Optionally clear state if session load fails
                // loadSessionById(null); // Or use a specific clear function
            }
            toast({
              title: 'Error Loading Session',
              description: `Could not load session ${sessionId}. Status: ${response.status}`,
              variant: 'destructive',
            });
          } else {
            const sessionData = await response.json();
            // IMPORTANT: Call the context function to update the shared state
            if (typeof loadSessionById === 'function') {
                 loadSessionById(sessionData);
            } else {
                 console.error("StateContext is missing the function to load session data!");
                 setSessionError(true); // Treat as error if context cannot be updated
                 toast({
                    title: 'Application Error',
                    description: 'Could not process session data.',
                    variant: 'destructive',
                  });
            }
          }
        } catch (error) {
          console.error(`Error fetching session ${sessionId}:`, error);
          setSessionError(true);
           if (typeof loadSessionById === 'function') {
              // Optionally clear state on fetch error
              // loadSessionById(null);
           }
          toast({
            title: 'Network Error',
            description: `Failed to connect to load session ${sessionId}.`,
            variant: 'destructive',
          });
        } finally {
          setIsLoadingSession(false);
        }
      };

      fetchSessionData();

    } else {
      // Reset state if no session ID in URL
      setSessionSelected(false);
      setSessionError(false);
       if (typeof loadSessionById === 'function') {
         // Optionally clear state when navigating away from a specific session
         // loadSessionById(null);
       }
    }
    // Add loadSessionById (or the actual function name) to dependency array
  }, [searchParams, loadSessionById]);


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
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading session data...</p>
        {/* Consider adding a spinner component here */}
      </div>
    );
  }

  // Case 3: Session selected, but loading failed OR loaded data is invalid (missing customerProfile)
  if (sessionError || !customerProfile) {
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
                          Add/Change Image for {recommendations.find(r => r.id === editingRecommendationId)?.item}
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
           <Button onClick={() => window.open('/moodboards', '_blank')} variant="secondary">
             Open User View
           </Button>
        </div>
      </div>
  );
}