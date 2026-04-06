'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { WizardProgress } from './wizard-progress';
import type { WizardProps, SlideDirection } from './wizard-types';

export function Wizard({ steps, onComplete, onDataChange, initialStep = 0, className }: WizardProps) {
  const safeInitial = Math.min(Math.max(0, initialStep), steps.length - 1);
  const [currentStep, setCurrentStep] = useState(safeInitial);
  const [wizardData, setWizardData] = useState<Record<string, unknown>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [direction, setDirection] = useState<SlideDirection>('forward');
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wizardDataRef = useRef<Record<string, unknown>>({});
  /** Evita doble `onComplete` antes de que React aplique `isCompleting`. */
  const completingRef = useRef(false);

  const safeCurrentStep = Math.min(currentStep, steps.length - 1);
  const step = steps[safeCurrentStep];
  const isFirstStep = safeCurrentStep === 0;
  const isLastStep = safeCurrentStep === steps.length - 1;

  const updateWizardData = useCallback((key: string, value: unknown) => {
    const next = { ...wizardDataRef.current, [key]: value };
    wizardDataRef.current = next;
    setWizardData(next);
  }, []);

  useEffect(() => {
    onDataChange?.(wizardData);
  }, [wizardData, onDataChange]);

  const handleNext = useCallback(async () => {
    if (isValidating || isAnimating || isCompleting || completingRef.current) return;
    setError(null);

    const latestData = wizardDataRef.current;

    if (step.validate) {
      setIsValidating(true);
      try {
        const isValid = await step.validate(latestData);
        if (!isValid) {
          setIsValidating(false);
          return;
        }
      } catch {
        setIsValidating(false);
        return;
      }
      setIsValidating(false);
    }

    if (isLastStep) {
      completingRef.current = true;
      setIsCompleting(true);
      try {
        await onComplete(latestData);
      } catch (err) {
        completingRef.current = false;
        setIsCompleting(false);
        setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
      }
      return;
    }

    setDirection('forward');
    setIsAnimating(true);
    requestAnimationFrame(() => {
      setCurrentStep(prev => prev + 1);
      setTimeout(() => setIsAnimating(false), 300);
    });
  }, [isLastStep, isValidating, isAnimating, isCompleting, onComplete, step]);

  const handleBack = useCallback(() => {
    if (isFirstStep || isAnimating || isCompleting) return;

    setDirection('backward');
    setIsAnimating(true);
    requestAnimationFrame(() => {
      setCurrentStep(prev => prev - 1);
      setTimeout(() => setIsAnimating(false), 300);
    });
  }, [isFirstStep, isAnimating, isCompleting]);

  const StepComponent = step.component;

  return (
    <div className={cn('flex w-full flex-col', className)}>
      <WizardProgress
        steps={steps}
        currentStep={safeCurrentStep}
        className="mb-8"
      />

      {error && (
        <div className="mb-6 rounded-lg bg-error-container/20 border border-error/20 p-4 text-center">
          <p className="text-sm text-on-error-container">{error}</p>
        </div>
      )}

      <div className="relative overflow-hidden">
        <div
          key={safeCurrentStep}
          className={cn(
            'transition-all duration-300 ease-out',
            isAnimating && direction === 'forward' && 'animate-slide-in-right',
            isAnimating && direction === 'backward' && 'animate-slide-in-left',
          )}
        >
          <StepComponent
            onNext={handleNext}
            onBack={isFirstStep ? undefined : handleBack}
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
            isCompleting={isCompleting}
            wizardData={wizardData}
            updateWizardData={updateWizardData}
          />
        </div>
      </div>
    </div>
  );
}
