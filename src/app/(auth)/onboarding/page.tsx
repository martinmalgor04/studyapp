import { Suspense } from 'react';
import { OnboardingClient } from './onboarding-client';

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface-container-low">
          <p className="text-on-surface-variant">Cargando...</p>
        </div>
      }
    >
      <OnboardingClient />
    </Suspense>
  );
}
