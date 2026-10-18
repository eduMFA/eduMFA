import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { UseFormGetValues } from "react-hook-form";

import { toMicrosoftCaRequest, type MicrosoftCaFormValues } from "./microsoftCaForm";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  caConnectorQueryKeys,
  getCaSpecificOptions,
  type CaConnectorWriteRequest
} from "@/api/caConnectors";

export interface MicrosoftCaOptionsParams {
  /** The CA of the form; it stays selectable until the worker lists it. */
  caValue: string;
  getValues: UseFormGetValues<MicrosoftCaFormValues>;
  isEditing: boolean;
}

export interface MicrosoftCaOptions {
  caOptions: string[];
  error: unknown;
  isFetching: boolean;
  /** Asks the worker with the current form values. */
  request: () => void;
  showCaSelect: boolean;
}

/**
 * `GET /caconnector/specific/microsoft`. The legacy controller asked the
 * worker for its CAs right after loading an existing connector; "Get
 * available CAs" asks with the current form values.
 */
export function useMicrosoftCaOptions({
  caValue,
  getValues,
  isEditing
}: MicrosoftCaOptionsParams): MicrosoftCaOptions {
  const apiClient = useApiClient();
  const [optionsRequest, setOptionsRequest] = useState<CaConnectorWriteRequest | null>(
    () => (isEditing ? toMicrosoftCaRequest(getValues(), true) : null)
  );
  const optionsQuery = useQuery({
    enabled: optionsRequest !== null,
    queryFn: ({ signal }) =>
      getCaSpecificOptions(apiClient, "microsoft", optionsRequest ?? {}, signal),
    queryKey: caConnectorQueryKeys.specificOptions("microsoft", optionsRequest ?? {})
  });
  const availableCas = optionsQuery.data?.available_cas;

  const request = () => {
    const nextRequest = toMicrosoftCaRequest(getValues(), isEditing);

    if (JSON.stringify(nextRequest) === JSON.stringify(optionsRequest)) {
      void optionsQuery.refetch();
    } else {
      setOptionsRequest(nextRequest);
    }
  };

  // The select keeps the stored CA selectable until the worker lists it, and
  // offers the blank entry the legacy `ng-options` rendered while nothing is set.
  const caOptions = [
    ...(caValue === "" ? [""] : []),
    ...(caValue !== "" && !(availableCas ?? []).includes(caValue) ? [caValue] : []),
    ...(availableCas ?? [])
  ];

  return {
    caOptions,
    error: optionsQuery.error,
    isFetching: optionsQuery.isFetching,
    request,
    showCaSelect: availableCas !== undefined || caValue !== ""
  };
}
