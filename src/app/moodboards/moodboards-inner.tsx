'use client';

import { generateCustomerProfile } from '@/ai/flows/customer-profile-generation';
import { generateDesignRecommendations } from '@/ai/flows/design-recommendation-output';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { useStateContext } from '@/lib/state-context'; // Ensure this path is correct
import Link from 'next/link';

const feedbackSchema = z.object({
  feedback: z.string().min(10, {
    message: 'Feedback must be at least 10 characters.',
  }),
});

export default function MoodboardsInnerPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true); // For initial session generation/loading
    const [showWizardPrompt, setShowWizardPrompt] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // IMPORTANT: Replace 'updateSessionState' with the actual function from your StateContext
    // that takes the full session data object and updates the context state.
    const {
      sessionState,
      setCustomerProfile,
      addFeedback,
      addRecommendation,
      getSessionId,
      loadSessionById // Use this function instead of updateSessionState
    } = useStateContext();

    const form = useForm<z.infer<typeof feedbackSchema>>({
        resolver: zodResolver(feedbackSchema),
        defaultValues: {
        feedback: '',
        },
    });

    // Get destructured values from session state
    const {
        recommendations,
        moodboards,
        customerProfile,
        feedback
    } = sessionState;

    // Hide the wizard prompt after first displaying it or if feedback exists
    useEffect(() => {
        if (feedback && feedback.length > 0) {
            setShowWizardPrompt(false);
        }
    }, [feedback]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [feedback]);

    // Updated initSession function for moodboards-inner.tsx
    useEffect(() => {
      const initSession = async () => {
        // Get sessionId from URL
        const sessionIdFromUrl = searchParams.get('session');

        if (!sessionIdFromUrl) {
          console.log("initSession: No session ID in URL. Redirecting.");
          router.push('/'); // Redirect if no session specified
          return;
        }

        // If we already have a customer profile loaded for this session ID
        // (assuming getSessionId() correctly reflects the loaded session), don't regenerate.
        if (sessionState.customerProfile && getSessionId() === sessionIdFromUrl) {
          console.log(`initSession: Profile already exists for session ${sessionIdFromUrl}. Skipping generation.`);
          setLoading(false);
          return;
        }

        setLoading(true);

        try {
          // First try to fetch the complete session data from server
          console.log(`Fetching session data for ID: ${sessionIdFromUrl}`);
          const sessionResponse = await fetch(`/api/sessions/${sessionIdFromUrl}`);
          
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            console.log(`Session data fetched successfully:`, JSON.stringify(sessionData).substring(0, 100) + '...');
            
            // Check if session has questionnaire data
            if (sessionData.questionnaire) {
              console.log(`Found questionnaire data for session ${sessionIdFromUrl}`);
              
              try {
                // Use questionnaire data stored in the session
                const params = sessionData.questionnaire;
                
                // Generate customer profile with timeout and error handling
                const profilePromise = generateCustomerProfile(params);
                const timeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Profile generation timed out')), 25000)
                );
                
                // Race against timeout
                const customerProfileResult = await Promise.race([profilePromise, timeoutPromise]);
                
                if (!customerProfileResult?.profileSummary) {
                  throw new Error('Generated profile is empty or invalid');
                }
                
                console.log(`Profile generated successfully. Length: ${customerProfileResult.profileSummary.length} chars`);
                
                // Set customer profile
                setCustomerProfile(customerProfileResult.profileSummary, sessionIdFromUrl);
                
                try {
                  // Generate design recommendations with timeout
                  console.log('Generating design recommendations');
                  const recPromise = generateDesignRecommendations({
                    customerProfile: customerProfileResult.profileSummary,
                    finalMoodboardDescription: 'Initial moodboard based on customer profile',
                  });
                  
                  const recTimeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Recommendation generation timed out')), 25000)
                  );
                  
                  // Race against timeout
                  const designRecommendationsResult = await Promise.race([recPromise, recTimeoutPromise]);
                  
                  if (designRecommendationsResult?.recommendations) {
                    console.log(`Generated ${designRecommendationsResult.recommendations.length} recommendations`);
                    
                    // Process recommendations one by one to avoid state update issues
                    for (const rec of designRecommendationsResult.recommendations) {
                      if (rec.item && rec.explanation) {
                        addRecommendation({
                          item: rec.item,
                          explanation: rec.explanation
                        });
                      }
                    }
                  } else {
                    console.warn('No recommendations were generated');
                    // Add a fallback recommendation
                    addRecommendation({
                      item: 'Design consultation',
                      explanation: 'Our team would like to discuss your preferences in more detail to provide tailored recommendations.'
                    });
                  }
                } catch (recError) {
                  console.error('Error generating recommendations:', recError);
                  // Add fallback recommendation on error
                  addRecommendation({
                    item: 'Design consultation',
                    explanation: 'Our team would like to discuss your preferences in more detail to provide tailored recommendations.'
                  });
                }
              } catch (profileError) {
                console.error('Error generating profile:', profileError);
                
                // Attempt to set a basic profile on error to avoid blocking the flow
                setCustomerProfile('Client seeking interior design services. Detailed preferences will be gathered during consultation.', sessionIdFromUrl);
                
                // Add a fallback recommendation
                addRecommendation({
                  item: 'Design consultation',
                  explanation: 'Our team would like to discuss your preferences in more detail to provide tailored recommendations.'
                });
              }
              
              setLoading(false);
              return;
            } else {
              console.log('Session found but no questionnaire data available.');
            }
          } else {
            console.warn(`Failed to fetch session data. Status: ${sessionResponse.status}`);
          }
          
          // If we couldn't get questionnaire data from session, try URL parameters
          console.log('Attempting to use URL parameters for profile generation');
          const params = {};
          let paramCount = 0;
          
          searchParams.forEach((value, key) => {
            if (key !== 'session') {
              params[key] = value;
              paramCount++;
            }
          });

          // Ensure we have questionnaire params before calling AI
          if (paramCount === 0) {
            console.log("No questionnaire parameters found. Cannot generate profile.");
            setLoading(false);
            toast({
              title: 'Missing Information',
              description: 'Could not find questionnaire data to initialize your session.',
              variant: 'destructive',
            });
            return;
          }

          try {
            console.log(`Generating profile using URL parameters for session ${sessionIdFromUrl}`);
            const profilePromise = generateCustomerProfile(params);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile generation timed out')), 25000)
            );
            
            // Race against timeout
            const customerProfileResult = await Promise.race([profilePromise, timeoutPromise]);

            if (!customerProfileResult?.profileSummary) {
              throw new Error('Generated profile is empty or invalid');
            }
            
            console.log('Profile generated successfully from URL parameters');

            // Set customer profile
            setCustomerProfile(customerProfileResult.profileSummary, sessionIdFromUrl);

            try {
              console.log('Generating recommendations from URL-based profile');
              const designRecommendationsResult = await generateDesignRecommendations({
                customerProfile: customerProfileResult.profileSummary,
                finalMoodboardDescription: 'Initial moodboard based on customer profile',
              });

              if (designRecommendationsResult?.recommendations) {
                console.log(`Generated ${designRecommendationsResult.recommendations.length} recommendations`);
                designRecommendationsResult.recommendations.forEach((rec) => {
                  addRecommendation({
                    item: rec.item,
                    explanation: rec.explanation
                  });
                });
              } else {
                console.warn('No recommendations were generated');
                // Add fallback recommendation
                addRecommendation({
                  item: 'Design consultation',
                  explanation: 'Our team would like to discuss your preferences in more detail to provide tailored recommendations.'
                });
              }
            } catch (recError) {
              console.error('Error generating recommendations:', recError);
              // Add fallback recommendation on error
              addRecommendation({
                item: 'Design consultation',
                explanation: 'Our team would like to discuss your preferences in more detail to provide tailored recommendations.'
              });
            }
          } catch (profileError) {
            console.error('Error generating profile from URL parameters:', profileError);
            
            // Set basic profile as fallback
            setCustomerProfile('Client seeking interior design services. Detailed preferences to be gathered during consultation.', sessionIdFromUrl);
            
            // Add fallback recommendation
            addRecommendation({
              item: 'Design consultation',
              explanation: 'Our team would like to discuss your preferences in more detail to provide tailored recommendations.'
            });
          }

        } catch (error) {
          console.error('Error initializing session:', error);
          toast({
            title: 'Initialization Error',
            description: 'Failed to initialize your design session. Please try again later.',
            variant: 'destructive',
          });
          
          // Don't redirect on error - provide fallback content instead
          setCustomerProfile('Design profile could not be generated. Please try again later.', sessionIdFromUrl);
          addRecommendation({
            item: 'Contact our design team',
            explanation: 'Our design experts are ready to help you create your perfect space.'
          });
        } finally {
          setLoading(false);
        }
      };

      initSession();
    }, [searchParams, router, sessionState.customerProfile, setCustomerProfile, addRecommendation, getSessionId, loadSessionById, toast]);
    
    // Update the polling useEffect
    useEffect(() => {
      const pollSession = async () => {
        const sessionId = searchParams.get('session');
        if (!sessionId) {
          // No session ID in URL, stop polling for this page instance
          console.log("Polling stopped: No session ID in URL.");
          return;
        }

        try {
          const res = await fetch(`/api/sessions/${sessionId}`);

          if (!res.ok) {
            // Handle errors gracefully
            if (res.status === 404) {
              console.warn(`Polling: Session ${sessionId} not found.`);
            } else {
              console.error(`Polling Error: Failed to fetch session ${sessionId}. Status: ${res.status}`);
            }
            return; // Stop processing if fetch failed
          }

          const latestSessionData = await res.json();

          if (!latestSessionData?.id) {
            console.warn(`Polling: Invalid data received for session ${sessionId}.`, latestSessionData);
            return; // Stop if data is invalid
          }

          // Basic comparison to check for updates
          const current = sessionState;
          const hasNewFeedback = (latestSessionData.feedback?.length || 0) > (current.feedback?.length || 0);
          const hasNewMoodboard = (latestSessionData.moodboards?.length || 0) > (current.moodboards?.length || 0);
          const hasNewImages = (latestSessionData.recommendations?.filter((r: any) => r.imageUrl)?.length || 0)
                              > (current.recommendations?.filter((r: any) => r.imageUrl)?.length || 0);

          if (hasNewFeedback || hasNewMoodboard || hasNewImages) {
            console.log(`Polling: Detected updates for session ${sessionId}. Updating state.`);
            // Update state using loadSessionById function
            if (typeof loadSessionById === 'function') {
              loadSessionById(latestSessionData);
            } else {
              console.error("Polling Error: Context is missing 'loadSessionById' function. Reloading as fallback.");
              // Fallback (less ideal)
              window.location.reload();
            }
          }
        } catch (e) {
          console.error('Polling Error: Exception during fetch/processing.', e);
        }
      };

      const interval = setInterval(pollSession, 5000); // Poll every 5 seconds
      return () => clearInterval(interval); // Cleanup interval on unmount

    }, [searchParams, loadSessionById, sessionState]);


    // Handler for submitting feedback
    const onSubmit = async (values: z.infer<typeof feedbackSchema>) => {
        try {
             const currentSessionId = getSessionId(); // Get current session ID from context
             if (!currentSessionId) {
                 toast({ title: 'Error', description: 'No active session found to submit feedback to.', variant: 'destructive'});
                 return;
             }

             console.log(`Submitting feedback for session ${currentSessionId}:`, values.feedback);
            // Add feedback to local state via context
            addFeedback(values.feedback, true); // true indicates feedback is from the user

            // TODO: Persist feedback to the backend/Redis associated with the currentSessionId
            // Example:
            // await fetch(`/api/sessions/${currentSessionId}/feedback`, { // Assuming a specific feedback endpoint
            //    method: 'POST',
            //    headers: { 'Content-Type': 'application/json' },
            //    body: JSON.stringify({ content: values.feedback, fromUser: true })
            // });
            // Or update the whole session:
            // await fetch(`/api/sessions/${currentSessionId}`, { method: 'PUT', ... })

            form.reset();

            toast({
                title: 'Feedback submitted',
                description: 'Your feedback has been sent to our design team.',
            });

            // Decide if showing the wizard prompt again makes sense after feedback
            // setShowWizardPrompt(true);

        } catch (error) {
            console.error('Error submitting feedback:', error);
            toast({
                title: 'Error',
                description: 'Failed to submit your feedback. Please try again.',
                variant: 'destructive',
            });
        }
    };

    // --- Rendering Logic ---

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
                <h1 className="text-4xl font-bold">
                Preparing Your <span className="text-primary">Design Experience</span>
                </h1>
                <div className="mt-8 space-y-4 w-full max-w-3xl">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                </div>
            </main>
            </div>
        );
    }

    // Get session ID for the wizard link *after* loading/initialization
    const currentSessionIdForLink = getSessionId();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <main className="flex flex-col items-center justify-center w-full flex-1 px-4 md:px-20 text-center">
            <h1 className="text-4xl font-bold">
                Your <span className="text-primary">Design Recommendations</span>
            </h1>

            {/* Show wizard link only if we have a valid session ID */}
            {showWizardPrompt && currentSessionIdForLink && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-md border border-yellow-200 w-full max-w-4xl">
                <p className="text-sm text-yellow-800">
                    Design Team View: <Link href={`/wizard?session=${currentSessionIdForLink}`} className="underline font-medium">Click here</Link> to open the dashboard for this session.
                </p>
                <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-6 text-xs"
                    onClick={() => setShowWizardPrompt(false)}
                >
                    Dismiss
                </Button>
                </div>
            )}

            <Tabs defaultValue="profile" className="w-full max-w-4xl mt-6">
                <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Customer Profile</TabsTrigger>
                <TabsTrigger value="moodboards">Moodboards</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-6">
                {customerProfile ? (
                    <Card>
                    <CardHeader>
                        <CardTitle>Your Design Profile</CardTitle>
                        <CardDescription>Based on your questionnaire responses</CardDescription>
                    </CardHeader>
                    <CardContent className="text-left whitespace-pre-line">
                        <p>{customerProfile}</p>
                    </CardContent>
                    </Card>
                ) : (
                    <Card>
                       <CardHeader><CardTitle>Profile Not Available</CardTitle></CardHeader>
                       <CardContent><p>Could not load your design profile. Please ensure you completed the questionnaire.</p></CardContent>
                    </Card>
                )}
                </TabsContent>

                <TabsContent value="moodboards" className="mt-6">
                {moodboards && moodboards.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {moodboards.map((moodboard) => (
                        <Card key={moodboard.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle>{moodboard.title}</CardTitle>
                            <CardDescription>Created by {moodboard.createdBy === 'wizard' ? 'Design Team' : 'AI'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-left text-sm mb-4">{moodboard.description}</p>
                            <div className="grid grid-cols-2 gap-2">
                            {moodboard.images.map((imageUrl, imgIndex) => (
                                <img
                                key={imgIndex}
                                src={imageUrl}
                                alt={`Moodboard image ${imgIndex + 1} for ${moodboard.title}`}
                                className="w-full h-48 object-cover rounded-md shadow-sm"
                                />
                            ))}
                            </div>
                        </CardContent>
                        </Card>
                    ))}
                    </div>
                ) : (
                    <Card>
                    <CardHeader>
                        <CardTitle>Moodboards Coming Soon</CardTitle>
                        <CardDescription>Our design team might add moodboards based on your feedback</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center text-muted-foreground">
                        Check back later or provide feedback to guide the design.
                        </p>
                    </CardContent>
                    </Card>
                )}
                </TabsContent>

                <TabsContent value="recommendations" className="mt-6">
                {recommendations && recommendations.length > 0 ? (
                    <div className="space-y-4">
                    {recommendations.map((recommendation) => (
                        <Card key={recommendation.id} className="overflow-hidden">
                        <CardHeader>
                            <CardTitle>{recommendation.item}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-left mb-4">{recommendation.explanation}</p>
                            {recommendation.imageUrl && (
                            <img
                                src={recommendation.imageUrl}
                                alt={`Recommendation image for ${recommendation.item}`}
                                className="w-full h-48 object-cover rounded-md shadow-md"
                            />
                            )}
                        </CardContent>
                        </Card>
                    ))}
                    </div>
                ) : (
                     <Card>
                       <CardHeader><CardTitle>Recommendations Not Available</CardTitle></CardHeader>
                       <CardContent><p>Recommendations are being generated or updated based on your profile and feedback.</p></CardContent>
                    </Card>
                )}
                </TabsContent>
            </Tabs>

            {/* Feedback Form */}
            <div className="mt-8 w-full max-w-4xl">
                <Card>
                <CardHeader>
                    <CardTitle>Provide Feedback</CardTitle>
                    <CardDescription>
                    Help us refine your design recommendations or tell us more about your style.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                        control={form.control}
                        name="feedback"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Your Feedback</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder="Tell us what you like or don't like..."
                                className="min-h-[120px]"
                                {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button type="submit" className="w-full" disabled={!customerProfile}>Submit Feedback</Button>
                         {!customerProfile && <p className="text-xs text-destructive">Feedback cannot be submitted until the profile is loaded.</p>}
                    </form>
                    </Form>
                </CardContent>
                </Card>
            </div>

            {/* Conversation History */}
            {feedback && feedback.length > 0 && (
                <div className="mt-8 w-full max-w-4xl">
                <Card>
                    <CardHeader>
                    <CardTitle>Conversation History</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-4">
                        {feedback.map((message) => (
                        <div
                            key={message.id}
                             className={`p-4 rounded-lg text-left ${
                                 message.fromUser
                                 ? 'bg-primary/10 ml-auto w-11/12 md:w-4/5' // User message
                                 : 'bg-secondary/10 mr-auto w-11/12 md:w-4/5' // Wizard message
                             }`}
                        >
                            <p className="text-sm font-medium mb-1">
                            {message.fromUser ? 'You' : 'Design Team'}
                            </p>
                            <p className="whitespace-pre-line">{message.content}</p>
                            <p className="text-xs text-muted-foreground text-right mt-1">
                            {new Date(message.timestamp).toLocaleString()}
                            </p>
                        </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    </CardContent>
                </Card>
                </div>
            )}
            </main>
        </div>
    );
}