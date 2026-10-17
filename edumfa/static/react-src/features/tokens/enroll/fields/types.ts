import {
  type CaConnectorName,
  type EduMfaServers,
  type ServiceIds
} from "@/api/config";
import {
  type EnrollFormError,
  type EnrollFormState,
  type ResolvedEnrollForm
} from "@/features/tokens/enroll/enrollForm";

/** Server-side lists the type-specific fields choose from. */
export interface EnrollLookups {
  caConnectors: readonly CaConnectorName[];
  eduMfaServers: EduMfaServers;
  /** `question.num_answers` from the system config. */
  numAnswers: string;
  /** Mobile numbers of the selected user (SMS token). */
  phones: readonly string[];
  questions: readonly string[];
  radiusNames: readonly string[];
  realms: readonly string[];
  serviceIds: ServiceIds;
  /** `sms_gateways` policy values. */
  smsGateways: readonly string[];
}

export interface TokenTypeFieldsProps {
  errors: readonly EnrollFormError[];
  form: ResolvedEnrollForm;
  /** `indexedsecret_force_attribute`: the secret is set by policy, not typed. */
  indexedSecretForced: boolean;
  isWizard: boolean;
  lookups: EnrollLookups;
  onChange: (patch: Partial<EnrollFormState>) => void;
  rights: readonly string[];
}
