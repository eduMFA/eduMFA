import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type PropsWithChildren
} from "react";

import { createApiClient, type ApiClient } from "./client";
import { useAuth } from "../auth/AuthProvider";

const ApiClientContext = createContext<ApiClient | null>(null);

export function ApiClientProvider({ children }: PropsWithChildren) {
  const { authToken, dropSession } = useAuth();

  const handleAuthError = useCallback(() => {
    dropSession();
  }, [dropSession]);

  const client = useMemo(
    () =>
      createApiClient({
        getAuthToken: () => authToken,
        onAuthError: handleAuthError
      }),
    [authToken, handleAuthError]
  );

  return (
    <ApiClientContext.Provider value={client}>{children}</ApiClientContext.Provider>
  );
}

export function useApiClient(): ApiClient {
  const client = useContext(ApiClientContext);

  if (!client) {
    throw new Error("useApiClient must be used inside ApiClientProvider.");
  }

  return client;
}
