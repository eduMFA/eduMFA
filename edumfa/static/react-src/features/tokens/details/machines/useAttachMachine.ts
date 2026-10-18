import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import { attachTokenToMachine, type ApplicationDefinitions } from "@/api/machines";
import { fixMachine } from "@/lib/machine";

export interface AttachMachineParams {
  applications: ApplicationDefinitions;
  /** Re-reads the assignments after the token was attached. */
  onAttached: () => Promise<void>;
  serial: string;
}

/**
 * The attach form: application, machine and the application's options.
 * "offline" attachments carry no machine. The form is cleared once the
 * token is attached.
 */
export function useAttachMachine({
  applications,
  onAttached,
  serial
}: AttachMachineParams) {
  const apiClient = useApiClient();
  const [application, setApplication] = useState("");
  const [machine, setMachine] = useState("");
  const [options, setOptions] = useState<Record<string, boolean | string>>({});

  const isOffline = application === "offline";
  const machineReference = fixMachine(machine);
  const optionSpecs = applications[application]?.options ?? {};
  const hasMissingRequiredOption = Object.entries(optionSpecs).some(
    ([name, spec]) => spec.required && !options[name]
  );
  const canAttach =
    application.length > 0 &&
    (isOffline || machineReference.id.length > 0) &&
    !hasMissingRequiredOption;

  const attach = useMutation({
    mutationFn: () =>
      attachTokenToMachine(apiClient, {
        ...options,
        application,
        // Offline tokens are deliberately not bound to a machine.
        machineid: isOffline ? "0" : machineReference.id,
        resolver: isOffline ? "" : machineReference.resolver,
        serial
      }),
    onSuccess: async () => {
      setApplication("");
      setMachine("");
      setOptions({});
      await onAttached();
    }
  });

  const selectApplication = (name: string) => {
    setApplication(name);
    setOptions({});
  };
  const setOption = (name: string, value: boolean | string) => {
    setOptions((previous) => ({ ...previous, [name]: value }));
  };

  return {
    application,
    attach,
    canAttach,
    isOffline,
    machine,
    optionSpecs,
    options,
    selectApplication,
    setMachine,
    setOption
  };
}
