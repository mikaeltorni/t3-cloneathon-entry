/**
 * messageForm/index.ts
 * 
 * Centralized exports for message form focused hooks
 */
export { useFormState } from './useFormState';
export { useModelCapabilities } from './useModelCapabilities';
export { useFormValidation } from './useFormValidation';
export { useFormSubmission } from './useFormSubmission';
export { useUIFocus } from './useUIFocus';
export { useStateEffects } from './useStateEffects';

export type { 
  FormStateConfig, 
  UseFormStateReturn 
} from './useFormState';

export type { 
  UseModelCapabilitiesReturn 
} from './useModelCapabilities';

export type { 
  FormValidationConfig, 
  UseFormValidationReturn 
} from './useFormValidation';

export type { 
  FormSubmissionConfig, 
  UseFormSubmissionReturn 
} from './useFormSubmission';

export type { 
  StateEffectsConfig 
} from './useStateEffects'; 