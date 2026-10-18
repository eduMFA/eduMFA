import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { useState } from "react";

import type { OptionValues } from "./types";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  attachTokenToMachine,
  type ApplicationDefinitions,
  type ApplicationOptionSpec
} from "@/api/machines";
import { fixSerial } from "@/lib/serial";

export interface AttachTokenParams {
  applications: ApplicationDefinitions;
  invalidateTokens: () => Promise<void>;
  machineId: string;
  machineResolver: string;
}

export interface AttachTokenForm {
  application: string;
  /** The option specs of the chosen application. */
  applicationOptions: Record<string, ApplicationOptionSpec>;
  canAttach: boolean;
  mutation: UseMutationResult<number, Error, void>;
  options: OptionValues;
  /** Switches the application and drops the options typed for the previous one. */
  selectApplication: (application: string) => void;
  serial: string;
  setOption: (name: string, value: boolean | string) => void;
  setSerial: (serial: string) => void;
}

/** The "attach a new token" form: serial, application and its options. */
export function useAttachToken({
  applications,
  invalidateTokens,
  machineId,
  machineResolver
}: AttachTokenParams): AttachTokenForm {
  const apiClient = useApiClient();
  const [newSerial, setNewSerial] = useState("");
  const [newApplication, setNewApplication] = useState("");
  const [newOptions, setNewOptions] = useState<OptionValues>({});

  const newApplicationOptions = applications[newApplication]?.options ?? {};
  const hasMissingRequiredOption = Object.entries(newApplicationOptions).some(
    ([name, spec]) => spec.required && !newOptions[name]
  );
  const canAttach =
    fixSerial(newSerial).length > 0 &&
    newApplication.length > 0 &&
    !hasMissingRequiredOption;

  const mutation = useMutation({
    mutationFn: () =>
      attachTokenToMachine(apiClient, {
        ...newOptions,
        application: newApplication,
        machineid: machineId,
        resolver: machineResolver,
        serial: fixSerial(newSerial)
      }),
    onSuccess: async () => {
      setNewSerial("");
      setNewApplication("");
      setNewOptions({});
      await invalidateTokens();
    }
  });

  return {
    application: newApplication,
    applicationOptions: newApplicationOptions,
    canAttach,
    mutation,
    options: newOptions,
    selectApplication: (application) => {
      setNewApplication(application);
      setNewOptions({});
    },
    serial: newSerial,
    setOption: (name, value) => {
      setNewOptions((previous) => ({ ...previous, [name]: value }));
    },
    setSerial: setNewSerial
  };
}
