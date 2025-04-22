'use client';

import {generateCustomerProfile} from '@/ai/flows/customer-profile-generation';
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
import {Input} from '@/components/ui/input';

const feedbackSchema = z.object({
  feedback: z.string().min(10, {
    message: 'Feedback must be at least 10 characters.',
  }),
});

export default function MoodboardsPage() {
  const searchParams = useSearchParams();
  const [customerProfile, setCustomerProfile] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[] | null>(null);
  const [allSearchParams, setAllSearchParams] = useState<{ [key: string]: string }>({}); // Store all search params
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [imageUrls, setImageUrls] = useState<{[key: number]: string}>({});

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

  const regenerateRecommendations = async (updatedCustomerProfile: string) => {
    // Generate design recommendations based on customer profile
    const designRecommendationsResult = await generateDesignRecommendations({
      customerProfile: updatedCustomerProfile,
      finalMoodboardDescription: 'A description of a moodboard that the client has selected', // Removed static value
    });
    setRecommendations(designRecommendationsResult?.recommendations || null);
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
        await regenerateRecommendations(customerProfileResult.profileSummary);
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
      await regenerateRecommendations(updatedCustomerProfileResult.profileSummary);
    }

    // Set feedbackSubmitted to trigger re-fetch
    setFeedbackSubmitted(prevState => !prevState);
  };

  const handleImageUpload = (index: number, url: string) => {
    setImageUrls(prev => ({...prev, [index]: url}));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold">
          Your <span className="text-primary">Design Recommendations</span>
        </h1>

        {customerProfile && (
          <div className="mt-6">
            <h2 className="text-2xl font-semibold">Customer Profile</h2>
            <p className="text-left">{customerProfile}</p>
          </div>
        )}

        {recommendations ? (
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
                  <Input
                    type="text"
                    placeholder="Enter image URL"
                    value={imageUrls[index] || ''}
                    onChange={e => handleImageUpload(index, e.target.value)}
                    className="mt-2"
                  />
                  {imageUrls[index] && (
                    <img
                      src={imageUrls[index]}
                      alt={`Recommendation ${index + 1}`}
                      className="w-full h-48 object-cover rounded-md mt-2 shadow-md"
                    />
                  )}
                </CardContent>
              </Card>
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
                          placeholder="Enter your feedback to refine the design recommendations"
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
          </div>
        ) : (
          <p className="mt-6">Loading design recommendations...</p>
        )}
      </main>
    </div>
  );
}
