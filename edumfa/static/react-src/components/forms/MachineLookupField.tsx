import { useLingui } from "@lingui/react/macro";
import { Autocomplete, Loader } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import { getMachines, machineQueryKeys } from "@/api/machines";
import { useAuth } from "@/auth/AuthProvider";
import { formatMachineSuggestion } from "@/lib/machine";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

export interface MachineLookupFieldProps {
  id: string;
  label?: ReactNode;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}

/**
 * Machine input with live suggestions from `GET /machine/?any=`, replacing
 * the legacy `attach-machine` directive. Pass the selected value through
 * `fixMachine` to get the id and resolver back.
 */
export function MachineLookupField({
  id,
  label,
  onChange,
  required = false,
  value
}: MachineLookupFieldProps) {
  const apiClient = useApiClient();
  const { t } = useLingui();
  const { isAuthenticated } = useAuth();
  const searchTerm = useDebouncedValue(value.trim(), 150);
  // A picked suggestion contains " [" and would never match a machine again.
  const canSearch = searchTerm.length > 0 && !searchTerm.includes("[");
  const params = { any: searchTerm };
  const suggestionsQuery = useQuery({
    enabled: isAuthenticated && canSearch,
    queryFn: ({ signal }) => getMachines(apiClient, params, signal),
    queryKey: machineQueryKeys.list(params),
    staleTime: 10_000
  });

  const suggestions = (suggestionsQuery.data ?? []).map(formatMachineSuggestion);
  const noResults = canSearch && suggestionsQuery.isSuccess && suggestions.length === 0;

  return (
    <Autocomplete
      autoComplete="off"
      data={suggestions}
      description={noResults ? t`No machine found` : undefined}
      filter={({ options }) => options}
      id={id}
      label={label ?? t`Machine`}
      mb="sm"
      onChange={onChange}
      placeholder={t`start typing a machine.`}
      required={required}
      rightSection={suggestionsQuery.isFetching ? <Loader size="xs" /> : null}
      value={value}
    />
  );
}
