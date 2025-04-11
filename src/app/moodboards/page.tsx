
'use client';

import {generateCustomerProfile} from '@/ai/flows/customer-profile-generation';
import {generateMoodboard} from '@/ai/flows/moodboard-generation';
import {useSearchParams} from 'next/navigation';
import {useEffect, useState} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';

export default function MoodboardsPage() {
  const searchParams = useSearchParams();
  const [moodboard, setMoodboard] = useState<{
    moodboardDescription: string;
    imageUrls: string[];
  } | null>(null);
  const [customerProfile, setCustomerProfile] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!searchParams) return;

      const budget = searchParams.get('budget') || '';
      const tastes = searchParams.get('tastes') || '';
      const goals = searchParams.get('goals') || '';
      const needs = searchParams.get('needs') || '';

      // Generate customer profile
      const customerProfileResult = await generateCustomerProfile({
        budget,
        tastes,
        goals,
        needs,
      });
      setCustomerProfile(customerProfileResult?.profileSummary || null);

      if (customerProfileResult?.profileSummary) {
        // Generate moodboard based on customer profile
        const moodboardResult = await generateMoodboard({
          customerProfile: customerProfileResult.profileSummary,
        });
        setMoodboard(moodboardResult || null);
      }
    };

    fetchData();
  }, [searchParams]);

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
                <Button>Provide Feedback</Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="mt-6">Loading moodboards...</p>
        )}
      </main>
    </div>
  );
}
