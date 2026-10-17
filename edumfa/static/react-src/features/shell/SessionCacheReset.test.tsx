import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SessionCacheReset } from "./SessionCacheReset";
import { AuthProvider, buildSession } from "@/auth/AuthProvider";
import { clearSession, lockSession, setSession } from "@/auth/sessionStore";

const queryKey = ["tokens", "list", {}];

function renderReset(queryClient: QueryClient) {
  return render(
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <SessionCacheReset />
      </QueryClientProvider>
    </AuthProvider>
  );
}

describe("SessionCacheReset", () => {
  it("keeps the cache through a lock and drops it when the session ends", () => {
    const queryClient = new QueryClient();
    setSession(
      buildSession({ realm: "realm1", role: "admin", token: "jwt", username: "admin" })
    );
    queryClient.setQueryData(queryKey, { count: 4 });
    renderReset(queryClient);

    act(() => {
      lockSession();
    });
    expect(queryClient.getQueryData(queryKey)).toEqual({ count: 4 });

    act(() => {
      clearSession();
    });
    expect(queryClient.getQueryData(queryKey)).toBeUndefined();
  });

  it("leaves a cache alone that was filled without a session", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKey, { count: 1 });
    renderReset(queryClient);

    act(() => {
      clearSession();
    });
    expect(queryClient.getQueryData(queryKey)).toEqual({ count: 1 });
  });
});
