'use client';

import { Suspense } from 'react';
import MoodboardsInnerPage from './moodboards-inner';

export default function MoodboardsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MoodboardsInnerPage />
    </Suspense>
  );
}
