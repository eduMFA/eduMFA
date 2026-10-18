import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import type { FidoState } from "./results/types";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  enrollToken,
  type TokenEnrollDetail,
  type TokenEnrollRequest
} from "@/api/tokens";
import { useFidoErrorMessage } from "@/auth/useFidoErrorMessage";
import { registerU2fToken } from "@/auth/u2f";
import { registerWebAuthnCredential } from "@/auth/webauthn";
import { notify } from "@/lib/notify";

export interface FidoRegistration {
  /** The second `/token/init` step failed. */
  error: Error | null;
  register: (detail: TokenEnrollDetail) => Promise<void>;
  /** Forgets the previous ceremony before a new enrollment. */
  reset: () => void;
  state: FidoState;
}

/** Runs the browser ceremony the enroll response asks for; null when it asks for none. */
function runRegistrationCeremony(detail: TokenEnrollDetail) {
  if (detail.u2fRegisterRequest) {
    return registerU2fToken(detail.u2fRegisterRequest);
  }
  if (detail.webAuthnRegisterRequest) {
    return registerWebAuthnCredential(detail.webAuthnRegisterRequest);
  }
  return Promise.resolve(null);
}

/**
 * Port of `register_fido`: the browser ceremony for a U2F or WebAuthn
 * enrollment, then the second `/token/init` step with its result.
 */
export function useFidoRegistration(
  sessionParams: TokenEnrollRequest
): FidoRegistration {
  const apiClient = useApiClient();
  const describeFidoError = useFidoErrorMessage();
  const [state, setState] = useState<FidoState>({ pending: false, subject: "" });
  const mutation = useMutation({
    mutationFn: (request: TokenEnrollRequest) => enrollToken(apiClient, request)
  });

  const register = async (detail: TokenEnrollDetail) => {
    setState({ pending: true, subject: "" });

    try {
      const registration = await runRegistrationCeremony(detail);

      if (!registration) {
        setState({ pending: false, subject: "" });

        return;
      }

      const result = await mutation.mutateAsync({
        ...registration,
        ...sessionParams,
        serial: detail.serial
      });
      const subject =
        result.detail.u2fRegisterResponse?.subject ??
        result.detail.webAuthnRegisterResponse?.subject ??
        "";

      setState({ pending: false, subject });
    } catch (error) {
      notify(describeFidoError(error), "danger");
      setState({ pending: false, subject: "" });
    }
  };

  return {
    error: mutation.error,
    register,
    reset: () => {
      setState({ pending: false, subject: "" });
    },
    state
  };
}
