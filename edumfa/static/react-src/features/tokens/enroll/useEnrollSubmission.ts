import { useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  buildEnrollRequest,
  buildSessionParams,
  type EnrollMode,
  type EnrollSession,
  type ResolvedEnrollForm
} from "./enrollForm";
import type { FidoState } from "./results/types";
import { useFidoRegistration } from "./useFidoRegistration";
import { useRolloutState } from "./useRolloutState";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  enrollToken,
  tokenQueryKeys,
  type TokenEnrollDetail,
  type TokenEnrollRequest
} from "@/api/tokens";
import { notify } from "@/lib/notify";

export interface UseEnrollSubmissionOptions {
  mode: EnrollMode;
  resolved: ResolvedEnrollForm;
  rolloverSerial: string;
  session: EnrollSession;
}

/** State and actions from the first `POST /token/init` on. */
export interface EnrollSubmission {
  clientPart: string;
  /** `detail` of the last successful `/token/init`; `null` while the form shows. */
  enrolled: TokenEnrollDetail | null;
  /** Failed requests in display order: enrollment, client part, verification, FIDO. */
  errors: (Error | null)[];
  fido: FidoState;
  /** The token waits for its client (two-step OTP, push). */
  isClientWait: boolean;
  isSendingClientPart: boolean;
  isSubmitting: boolean;
  isVerifying: boolean;
  /** The token waits for the verification code. */
  isVerifyPending: boolean;
  /** Enrolls the same serial again with a fresh secret. */
  regenerate: () => void;
  rolloutState: string;
  /** Second step of a two-step OTP enrollment. */
  sendClientPart: () => void;
  sendVerifyResponse: () => void;
  setClientPart: (value: string) => void;
  setVerifyResponse: (value: string) => void;
  /** Back to the empty form ("Enroll a new token"). */
  startOver: () => void;
  submit: () => void;
  verifyResponse: string;
}

/**
 * Port of the `/token/init` round trips of `tokenEnrollController`: the
 * enrollment itself, the follow-up steps (client part, verification, FIDO
 * ceremony) and the rollout state polled in between.
 */
export function useEnrollSubmission({
  mode,
  resolved,
  rolloverSerial,
  session
}: UseEnrollSubmissionOptions): EnrollSubmission {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { t } = useLingui();
  const [enrolled, setEnrolled] = useState<TokenEnrollDetail | null>(null);
  const [enrollAttempt, setEnrollAttempt] = useState(0);
  const [clientPart, setClientPart] = useState("");
  const [verifyResponse, setVerifyResponse] = useState("");
  const sessionParams = buildSessionParams(resolved, session);
  const submitInit = (request: TokenEnrollRequest) => enrollToken(apiClient, request);
  const fido = useFidoRegistration(sessionParams);

  // Port of the enrollment `callback`.
  const handleEnrolled = (detail: TokenEnrollDetail) => {
    setEnrolled(detail);
    setEnrollAttempt((attempt) => attempt + 1);
    setClientPart("");
    fido.reset();
    window.scrollTo(0, 0);
    void queryClient.invalidateQueries({ queryKey: tokenQueryKeys.all });

    if (detail.u2fRegisterRequest || detail.webAuthnRegisterRequest) {
      void fido.register(detail);
    }
  };

  const enrollMutation = useMutation({
    mutationFn: submitInit,
    onSuccess: (result) => {
      handleEnrolled(result.detail);
    }
  });
  const clientPartMutation = useMutation({
    mutationFn: submitInit,
    onSuccess: (result) => {
      handleEnrolled(result.detail);
    }
  });
  const verifyMutation = useMutation({
    mutationFn: submitInit,
    onSuccess: (result) => {
      if (result.value) {
        notify(t`Token successfully verified`, "success");
      }

      setVerifyResponse("");
      handleEnrolled(result.detail);
    }
  });
  const rolloutState = useRolloutState(enrolled, enrollAttempt);
  const buildRequest = () =>
    buildEnrollRequest(resolved, { mode, rolloverSerial, session });

  return {
    clientPart,
    enrolled,
    errors: [
      enrollMutation.error,
      clientPartMutation.error,
      verifyMutation.error,
      fido.error
    ],
    fido: fido.state,
    isClientWait: rolloutState === "clientwait",
    isSendingClientPart: clientPartMutation.isPending,
    isSubmitting: enrollMutation.isPending,
    isVerifying: verifyMutation.isPending,
    isVerifyPending: rolloutState === "verify",
    regenerate: () => {
      if (enrolled) {
        enrollMutation.mutate({ ...buildRequest(), serial: enrolled.serial });
      }
    },
    rolloutState,
    sendClientPart: () => {
      if (enrolled) {
        clientPartMutation.mutate({
          ...sessionParams,
          otpkey: clientPart.replace(/ /g, ""),
          otpkeyformat: "base32check",
          serial: enrolled.serial,
          type: resolved.type
        });
      }
    },
    sendVerifyResponse: () => {
      if (enrolled) {
        verifyMutation.mutate({
          ...sessionParams,
          serial: enrolled.serial,
          type: resolved.type,
          verify: verifyResponse
        });
      }
    },
    setClientPart,
    setVerifyResponse,
    startOver: () => {
      setEnrolled(null);
    },
    submit: () => {
      enrollMutation.mutate(buildRequest());
    },
    verifyResponse
  };
}
