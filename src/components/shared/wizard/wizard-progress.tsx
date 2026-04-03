'use client';

import { cn } from '@/lib/utils/cn';
import type { WizardStep } from './wizard-types';

interface WizardProgressProps {
  steps: WizardStep[];
  currentStep: number;
  className?: string;
}

export function WizardProgress({ steps, currentStep, className }: WizardProgressProps) {
  if (steps.length <= 1) return null;

  return (
    <nav aria-label="Progreso del wizard" className={cn('w-full', className)}>
      <ol className="flex items-center justify-center gap-2 sm:gap-0">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isFuture = index > currentStep;

          return (
            <li
              key={step.id}
              className="flex items-center"
            >
              {index > 0 && (
                <div
                  className={cn(
                    'hidden h-0.5 w-8 sm:block md:w-16 transition-colors duration-300',
                    isCompleted ? 'bg-secondary' : 'bg-outline-variant/30',
                  )}
                  aria-hidden="true"
                />
              )}

              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300',
                    isActive && 'border-tertiary bg-tertiary text-on-tertiary scale-110',
                    isCompleted && 'border-secondary bg-secondary text-on-secondary',
                    isFuture && 'border-outline-variant/40 bg-surface-container-lowest text-on-surface-variant/50',
                  )}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      check
                    </span>
                  ) : (
                    <span className="text-xs font-bold font-body">{index + 1}</span>
                  )}
                </div>

                <span
                  className={cn(
                    'hidden text-center font-body text-[10px] font-medium leading-tight sm:block max-w-[5rem]',
                    isActive && 'text-tertiary',
                    isCompleted && 'text-secondary',
                    isFuture && 'text-on-surface-variant/50',
                  )}
                >
                  {step.title}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
