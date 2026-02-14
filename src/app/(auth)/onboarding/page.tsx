import { Suspense } from 'react';
import { OnboardingClient } from './onboarding-client';

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
          <p className="text-gray-500">Cargando...</p>
        </div>
      }
    >
      <OnboardingClient />
    </Suspense>
  );
}
