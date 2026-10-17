import { I18nProvider } from "@lingui/react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";

import { ApiClientProvider } from "@/api/ApiClientProvider";
import { i18n } from "@/app/i18n";
import { theme } from "@/app/theme";
import { AuthProvider } from "@/auth/AuthProvider";

export interface RenderWithProvidersOptions {
  route?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  { route = "/" }: RenderWithProvidersOptions = {}
): RenderResult {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false }
    }
  });

  return render(
    <MantineProvider theme={theme}>
      <Notifications />
      <I18nProvider i18n={i18n}>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <ApiClientProvider>
              <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
            </ApiClientProvider>
          </QueryClientProvider>
        </AuthProvider>
      </I18nProvider>
    </MantineProvider>
  );
}
