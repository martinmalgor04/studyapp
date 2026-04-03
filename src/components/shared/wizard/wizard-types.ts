import type { ComponentType } from 'react';

export interface StepProps {
  onNext: () => void;
  onBack?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  wizardData: Record<string, unknown>;
  updateWizardData: (key: string, value: unknown) => void;
}

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  component: ComponentType<StepProps>;
  validate?: (wizardData: Record<string, unknown>) => boolean | Promise<boolean>;
  optional?: boolean;
}

export interface WizardProps {
  steps: WizardStep[];
  onComplete: (data: Record<string, unknown>) => void | Promise<void>;
  onDataChange?: (data: Record<string, unknown>) => void;
  initialStep?: number;
  className?: string;
}

export type SlideDirection = 'forward' | 'backward';
