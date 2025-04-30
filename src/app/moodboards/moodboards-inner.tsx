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
import { useStateContext } from '@/lib/state-context';
import Link from 'next/link';

const feedbackSchema = z.object({
  feedback: z.string().min(10, {
    message: 'Feedback must be at least 10 characters.',
  }),
});

export default function MoodboardsInnerPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [showWizardPrompt, setShowWizardPrompt] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);
  
    const { 
      sessionState, 
      setCustomerProfile, 
      addFeedback, 
      addRecommendation,
      getSessionId
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
  
    // Add a poller for real-time updates
    useEffect(() => {
      const pollSession = async () => {
        try {
          const sessionId = searchParams.get('session');
          if (!sessionId) {
            router.push('/');
            return;
          }
          
          const res = await fetch(`/api/sessions?id=${sessionId}`);
          const data = await res.json();
    
          if (!data?.id) return;
    
          const current = sessionState;
    
          const hasNewFeedback = (data.feedback?.length || 0) > current.feedback.length;
          const hasNewMoodboard = (data.moodboards?.length || 0) > current.moodboards.length;
          const hasNewImages = (data.recommendations?.filter((r: any) => r.imageUrl)?.length || 0)
                              > current.recommendations.filter(r => r.imageUrl).length;
    
          if (hasNewFeedback || hasNewMoodboard || hasNewImages) {
            window.location.reload(); // 或：setSessionState(data);
          }
        } catch (e) {
          console.error('Error polling session from Redis', e);
        }
      };
    
      const interval = setInterval(pollSession, 5000);
      return () => clearInterval(interval);
    }, [sessionState]);
    
  
    // Update the prompt display logic
    // Hide the wizard prompt after first displaying it
    useEffect(() => {
      // If we have feedback, don't show the wizard prompt again
      if (feedback && feedback.length > 0) {
        setShowWizardPrompt(false);
      }
    }, [feedback]);
  
    // Auto-scroll to bottom of chat whenever feedback changes
    useEffect(() => {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, [feedback]);
  
    useEffect(() => {
      const initSession = async () => {
        // If we already have a customer profile, don't regenerate
        if (sessionState.customerProfile) {
          setLoading(false);
          return;
        }
  
        setLoading(true);
  
        const params: { [key: string]: string } = {};
        searchParams.forEach((value, key) => {
          params[key] = value;
        });
        
        // If no search params, redirect to home
        if (Object.keys(params).length === 0) {
          router.push('/');
          return;
        }
  
        try {
          // Generate customer profile with Gemini
          const customerProfileResult = await generateCustomerProfile({
            ...params,
          } as any);
          
          if (!customerProfileResult?.profileSummary) {
            throw new Error('Failed to generate customer profile');
          }
          
          // Save to state context
          setCustomerProfile(customerProfileResult.profileSummary);
          
          // Generate initial design recommendations
          const designRecommendationsResult = await generateDesignRecommendations({
            customerProfile: customerProfileResult.profileSummary,
            finalMoodboardDescription: 'Initial moodboard based on customer profile',
          });
          
          // Add recommendations to state
          if (designRecommendationsResult?.recommendations) {
            designRecommendationsResult.recommendations.forEach((rec: any) => {
              addRecommendation({
                item: rec.item,
                explanation: rec.explanation
              });
            });
          }
        } catch (error) {
          console.error('Error initializing session:', error);
          toast({
            title: 'Error',
            description: 'Failed to initialize your design session. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
        }
      };
  
      initSession();
    }, [searchParams, router, sessionState.customerProfile, setCustomerProfile, addRecommendation]);
  
    const onSubmit = async (values: z.infer<typeof feedbackSchema>) => {
      try {
        // Add feedback to state
        addFeedback(values.feedback, true);
        
        form.reset();
        
        toast({
          title: 'Feedback submitted',
          description: 'Your feedback has been sent to our design team.',
        });
  
        setShowWizardPrompt(true);
      } catch (error) {
        console.error('Error submitting feedback:', error);
        toast({
          title: 'Error',
          description: 'Failed to submit your feedback. Please try again.',
          variant: 'destructive',
        });
      }
    };
  
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
  
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <main className="flex flex-col items-center justify-center w-full flex-1 px-4 md:px-20 text-center">
          <h1 className="text-4xl font-bold">
            Your <span className="text-primary">Design Recommendations</span>
          </h1>
  
          {showWizardPrompt && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-md border border-yellow-200 w-full max-w-4xl">
              <p className="text-sm text-yellow-800">
                For the wizard: <Link href={`/wizard?session=${getSessionId()}`} className="underline font-medium">Click here</Link> to open the wizard view
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
                  <CardContent className="text-left">
                    <p>{customerProfile}</p>
                  </CardContent>
                </Card>
              ) : (
                <p>No profile information available yet.</p>
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
                              alt={`Moodboard image ${imgIndex + 1}`}
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
                    <CardDescription>Our design team is working on your moodboards</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground">
                      Based on your preferences, we're crafting unique moodboards just for you.
                      Check back soon or provide additional feedback to help us understand your style better.
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
                            alt={`Recommendation: ${recommendation.item}`}
                            className="w-full h-48 object-cover rounded-md shadow-md"
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p>No recommendations available yet.</p>
              )}
            </TabsContent>
          </Tabs>
  
          <div className="mt-8 w-full max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle>Provide Feedback</CardTitle>
                <CardDescription>
                  Help us refine your design recommendations
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
                              placeholder="Tell us what you like or don't like about the recommendations, or any additional preferences..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">Submit Feedback</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
  
          {feedback && feedback.length > 0 && (
            <div className="mt-8 w-full max-w-4xl">
              <Card>
                <CardHeader>
                  <CardTitle>Conversation History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {feedback.map((message) => (
                      <div 
                        key={message.id} 
                        className={`p-4 rounded-lg ${
                          message.fromUser 
                            ? 'bg-primary/10 ml-8' 
                            : 'bg-secondary/10 mr-8'
                        }`}
                      >
                        <p className="text-sm font-medium mb-1">
                          {message.fromUser ? 'You' : 'Design Team'}
                        </p>
                        <p className="text-left">{message.content}</p>
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