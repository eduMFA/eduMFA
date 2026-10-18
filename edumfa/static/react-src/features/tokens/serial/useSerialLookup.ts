import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { toSerialLookupParams } from "./toSerialLookupParams";
import {
  type AssignmentFilter,
  type LookupStep,
  type SerialLookupFieldName,
  type SerialLookupFields
} from "./types";
import { useApiClient } from "@/api/ApiClientProvider";
import { getSerialByOtp, type TokenSerialLookupResponse } from "@/api/tokens";

/**
 * The two-step lookup: the backend is asked for the number of candidate
 * tokens first (`count=1`), so the administrator can narrow the search
 * before running it.
 */
export function useSerialLookup() {
  const apiClient = useApiClient();
  const [otp, setOtp] = useState("");
  const [tokenType, setTokenType] = useState("");
  const [assignment, setAssignment] = useState<AssignmentFilter>("");
  const [serialSubstring, setSerialSubstring] = useState("");
  const [countWindow, setCountWindow] = useState("");
  const [step, setStep] = useState<LookupStep>("init");
  const [result, setResult] = useState<TokenSerialLookupResponse | null>(null);
  const [searchedOtp, setSearchedOtp] = useState("");
  const fields: SerialLookupFields = {
    assignment,
    countWindow,
    otp,
    serialSubstring,
    tokenType
  };

  const countMutation = useMutation({
    mutationFn: () =>
      getSerialByOtp(apiClient, otp.trim(), toSerialLookupParams(fields, true)),
    onSuccess: (data) => {
      setResult(data);
      setSearchedOtp(otp.trim());
      setStep("count");
    }
  });
  const searchMutation = useMutation({
    mutationFn: () =>
      getSerialByOtp(apiClient, otp.trim(), toSerialLookupParams(fields, false)),
    onSuccess: (data) => {
      setResult(data);
      setStep("found");
    }
  });

  const isBusy = countMutation.isPending || searchMutation.isPending;
  const inputsDisabled = step === "count" || isBusy;

  const backToForm = () => {
    setStep("init");
    setResult(null);
  };

  const setters: Record<SerialLookupFieldName, (value: string) => void> = {
    assignment: (value) => {
      setAssignment(value as AssignmentFilter);
    },
    countWindow: setCountWindow,
    otp: setOtp,
    serialSubstring: setSerialSubstring,
    tokenType: setTokenType
  };

  // Like the legacy `newOtp` flag: editing after a result hides that result.
  const editField = (name: SerialLookupFieldName, value: string) => {
    setters[name](value);

    if (step === "found") {
      backToForm();
    }
  };

  const submit = () => {
    if (otp.trim() && step === "init" && !isBusy) {
      countMutation.mutate();
    }
  };

  return {
    backToForm,
    countMutation,
    editField,
    fields,
    inputsDisabled,
    result,
    searchMutation,
    searchedOtp,
    step,
    submit
  };
}
