/**
 * Form components, public surface.
 *
 * All of these are client components. They import only the pure modules under
 * `@/lib/leads` (`constraints`, `types`, `labels`); nothing here pulls the server
 * side of lead delivery into the browser bundle.
 */

export { EnquiryForm } from './EnquiryForm'
export { ProgrammeEnquiryForm } from './ProgrammeEnquiryForm'
export { NewsletterForm } from './NewsletterForm'
export { TurnstileWidget } from './TurnstileWidget'
export { ErrorSummary, PrivacyNote, StatusRegion, SuccessPanel } from './FormFeedback'
export {
  CheckboxField,
  FormTextProvider,
  HoneypotField,
  RadioGroupField,
  SelectField,
  TextAreaField,
  TextField,
  type FormText,
  type SelectOption,
} from './fields'
export { fieldErrorKey, useLeadForm, type FormPhase, type LeadFormController } from './useLeadForm'
