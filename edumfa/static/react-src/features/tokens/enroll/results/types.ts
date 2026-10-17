import { type TokenEnrollDetail } from "@/api/tokens";
import { type ResolvedEnrollForm } from "@/features/tokens/enroll/enrollForm";

/** Progress of the U2F / WebAuthn registration that follows the first step. */
export interface FidoState {
  /** Waiting for the user to touch the authenticator. */
  pending: boolean;
  /** Description of the registered authenticator, e.g. "Yubico U2F EE Serial ...". */
  subject: string;
}

export interface EnrolledTokenResultProps {
  clientPart: string;
  detail: TokenEnrollDetail;
  fido: FidoState;
  form: ResolvedEnrollForm;
  isSendingClientPart: boolean;
  isWizard: boolean;
  onClientPartChange: (value: string) => void;
  onRegenerate: () => void;
  onSendClientPart: () => void;
  qrCodeWidth: number;
  /** Live rollout state; polled while the token waits for its client. */
  rolloutState: string;
  showSeed: boolean;
}
