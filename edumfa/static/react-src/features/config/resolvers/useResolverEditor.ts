import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, getResolver } from "@/api/config";
import {
  isResolverTestSuccess,
  resolverQueryKeys,
  setResolver,
  testResolver,
  type ResolverTestRequest,
  type ResolverWriteRequest
} from "@/api/resolvers";
import { useAuth } from "@/auth/AuthProvider";
import { notify } from "@/lib/notify";

export interface StoredResolver {
  /** The stored configuration keys; `null` while loading or for a new resolver. */
  data: Record<string, unknown> | null;
  error: unknown;
  isLoading: boolean;
  /** The form may render: nothing to load, or the resolver arrived. */
  isReady: boolean;
  /** The name of the route does not exist (any more). */
  notFound: boolean;
}

/**
 * Loads the resolver of the `:resolvername` route for the edit case; a new
 * resolver (empty name) is ready at once.
 */
export function useStoredResolver(resolverName: string): StoredResolver {
  const apiClient = useApiClient();
  const { isAuthenticated } = useAuth();
  const isEdit = resolverName.length > 0;

  const query = useQuery({
    enabled: isAuthenticated && isEdit,
    queryFn: ({ signal }) => getResolver(apiClient, resolverName, signal),
    queryKey: configQueryKeys.resolver(resolverName)
  });
  const resolver = isEdit ? (query.data?.[resolverName] ?? null) : null;

  return {
    data: resolver?.data ?? null,
    error: query.error,
    isLoading: query.isLoading,
    isReady: !isEdit || query.isSuccess,
    notFound: isEdit && query.isSuccess && resolver === null
  };
}

export interface SaveResolverVariables {
  request: ResolverWriteRequest;
  resolverName: string;
}

export interface UseSaveResolverOptions {
  /** Runs after the caches are refreshed, before the list page opens. */
  onSaved?: (variables: SaveResolverVariables) => void;
}

/**
 * `POST /resolver/<name>` followed by what every legacy resolver controller
 * did afterwards: refresh the resolver list and go back to it.
 */
export function useSaveResolver({ onSaved }: UseSaveResolverOptions = {}) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ request, resolverName }: SaveResolverVariables) =>
      setResolver(apiClient, resolverName, request),
    onSuccess: async (_resolverId, variables) => {
      await queryClient.invalidateQueries({ queryKey: resolverQueryKeys.lists });
      await queryClient.invalidateQueries({ queryKey: resolverQueryKeys.details });
      onSaved?.(variables);
      void navigate("/config/resolvers/list");
    }
  });
}

export interface ResolverTestOutcome {
  description: string;
  success: boolean;
}

export interface ResolverTester {
  dismiss: () => void;
  error: unknown;
  isPending: boolean;
  /** The last answer of `POST /resolver/test`, until dismissed. */
  outcome: ResolverTestOutcome | null;
  test: (request: ResolverTestRequest) => void;
}

/**
 * `POST /resolver/test`. The description is shown as a growl like the legacy
 * `inform.add`, and kept for the inline alert the legacy templates reserved.
 */
export function useResolverTester(): ResolverTester {
  const apiClient = useApiClient();
  const [outcome, setOutcome] = useState<ResolverTestOutcome | null>(null);

  const mutation = useMutation({
    mutationFn: (request: ResolverTestRequest) => testResolver(apiClient, request),
    onSuccess: (result) => {
      const success = isResolverTestSuccess(result.value);

      setOutcome({ description: result.description, success });
      notify(result.description, success ? "success" : "danger");
    }
  });

  return {
    dismiss: () => {
      setOutcome(null);
    },
    error: mutation.error,
    isPending: mutation.isPending,
    outcome,
    test: (request) => {
      mutation.mutate(request);
    }
  };
}
