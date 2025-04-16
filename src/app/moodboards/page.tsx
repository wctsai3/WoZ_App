'use client';

import {generateCustomerProfile} from '@/ai/flows/customer-profile-generation';
import {generateMoodboard} from '@/ai/flows/moodboard-generation';
import {generateDesignRecommendations} from '@/ai/flows/design-recommendation-output';
import {useSearchParams} from 'next/navigation';
import {useEffect, useState} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';

const feedbackSchema = z.object({
  feedback: z.string().min(10, {
    message: 'Feedback must be at least 10 characters.',
  }),
});

export default function MoodboardsPage() {
  const searchParams = useSearchParams();
  const [moodboard, setMoodboard] = useState<{
    moodboardDescription: string;
    imageUrls: string[];
  } | null>(null);
  const [customerProfile, setCustomerProfile] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[] | null>(null);
  const [allSearchParams, setAllSearchParams] = useState<{ [key: string]: string }>({}); // Store all search params
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const form = useForm<z.infer<typeof feedbackSchema>>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      feedback: '',
    },
  });

  useEffect(() => {
    const params: { [key: string]: string } = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    setAllSearchParams(params);
  }, [searchParams]);

  const regenerateMoodboard = async (updatedCustomerProfile: string) => {
    // Generate design recommendations based on customer profile and moodboard
    // For now, use a static moodboard description, later implement moodboard feedback
    const finalMoodboardDescription = 'A modern, minimalist design with a focus on natural light and neutral colors.';
    const designRecommendationsResult = await generateDesignRecommendations({
      customerProfile: updatedCustomerProfile,
      finalMoodboardDescription,
    });
    setRecommendations(designRecommendationsResult?.recommendations || null);

    // Generate moodboard based on customer profile and design recommendations
    const moodboardResult = await generateMoodboard({
      customerProfile: updatedCustomerProfile,
      designRecommendations: designRecommendationsResult?.recommendations || [],
    });
    setMoodboard(moodboardResult || null);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!searchParams) return;

      // Generate customer profile
      const customerProfileResult = await generateCustomerProfile({
        ...allSearchParams, // Pass all search parameters
      } as any);
      setCustomerProfile(customerProfileResult?.profileSummary || null);

      if (customerProfileResult?.profileSummary) {
        await regenerateMoodboard(customerProfileResult.profileSummary);
      }
    };

    fetchData();
  }, [allSearchParams, searchParams, feedbackSubmitted]);

  const onSubmit = async (values: z.infer<typeof feedbackSchema>) => {
    // Update customer profile with feedback
    const updatedCustomerProfileResult = await generateCustomerProfile({
      ...allSearchParams,
      feedback: values.feedback, // Include feedback in the profile generation
    } as any);

    setCustomerProfile(updatedCustomerProfileResult?.profileSummary || null);

    if (updatedCustomerProfileResult?.profileSummary) {
      await regenerateMoodboard(updatedCustomerProfileResult.profileSummary);
    }

    // Set feedbackSubmitted to trigger re-fetch
    setFeedbackSubmitted(prevState => !prevState);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold">
          Your <span className="text-primary">Moodboards</span>
        </h1>

        {customerProfile && (
          <div className="mt-6">
            <h2 className="text-2xl font-semibold">Customer Profile</h2>
            <p className="text-left">{customerProfile}</p>
          </div>
        )}

        {moodboard ? (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Moodboard Description</CardTitle>
                <CardDescription>Based on your preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-left">{moodboard.moodboardDescription}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Moodboard Images</CardTitle>
                <CardDescription>Visual representation of the design</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {moodboard.imageUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Moodboard Image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-md mb-2 shadow-md"
                  />
                ))}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-2">
                    <FormField
                      control={form.control}
                      name="feedback"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provide Feedback</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter your feedback to refine the moodboard"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit">Submit Feedback</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="mt-6">Loading moodboards...</p>
        )}

        {recommendations && (
          <div className="mt-6">
            <h2 className="text-2xl font-semibold">Design Recommendations</h2>
            {recommendations.map((recommendation, index) => (
              <Card key={index} className="mb-4">
                <CardHeader>
                  <CardTitle>{recommendation.item}</CardTitle>
                  <CardDescription>Recommendation {index + 1}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-left">{recommendation.explanation}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
