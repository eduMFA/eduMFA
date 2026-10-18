import { useLingui } from "@lingui/react/macro";
import {
  useMutation,
  useQueryClient,
  type UseMutationResult
} from "@tanstack/react-query";
import { useState } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import { assignToken, tokenQueryKeys } from "@/api/tokens";
import { notify } from "@/lib/notify";
import { fixSerial } from "@/lib/serial";

export interface AssignTokenForm {
  canAssign: boolean;
  mutation: UseMutationResult<boolean, Error, void>;
  pin: string;
  pinRepeat: string;
  pinsMatch: boolean;
  serial: string;
  setPin: (value: string) => void;
  setPinRepeat: (value: string) => void;
  setSerial: (value: string) => void;
}

/** Assigns an existing token to the user, with an optional PIN. */
export function useAssignToken(realm: string, username: string): AssignTokenForm {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { t } = useLingui();
  const [serial, setSerial] = useState("");
  const [pin, setPin] = useState("");
  const [pinRepeat, setPinRepeat] = useState("");
  const pinsMatch = pin === pinRepeat;
  const canAssign = fixSerial(serial).length > 0 && pinsMatch;
  const mutation = useMutation({
    mutationFn: () =>
      assignToken(apiClient, {
        pin,
        realm,
        serial: fixSerial(serial),
        user: username
      }),
    onSuccess: async () => {
      setSerial("");
      setPin("");
      setPinRepeat("");
      notify(t`Token assigned successfully.`, "success");
      window.scrollTo(0, 0);
      await queryClient.invalidateQueries({ queryKey: tokenQueryKeys.all });
    }
  });

  return {
    canAssign,
    mutation,
    pin,
    pinRepeat,
    pinsMatch,
    serial,
    setPin,
    setPinRepeat,
    setSerial
  };
}
