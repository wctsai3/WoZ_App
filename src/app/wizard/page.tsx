'use client';

import { Suspense } from 'react';
import WizardDashboardInner from './wizard-dashboard-inner';

export default function WizardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WizardDashboardInner />
    </Suspense>
  );
}
