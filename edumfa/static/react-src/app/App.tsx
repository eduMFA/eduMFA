import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@lingui/react";
import { useState } from "react";

import { HashbangRouter } from "./HashbangRouter";
import { i18n } from "./i18n";
import { createEduMfaQueryClient } from "./queryClient";
import { theme } from "./theme";
import { ApiClientProvider } from "@/api/ApiClientProvider";
import { AuthProvider } from "@/auth/AuthProvider";
import { AppShell } from "@/features/shell/AppShell";
import { SessionCacheReset } from "@/features/shell/SessionCacheReset";

export function App() {
  const [queryClient] = useState(() => createEduMfaQueryClient());

  return (
    <MantineProvider theme={theme}>
      <Notifications position="top-right" />
      <I18nProvider i18n={i18n}>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <SessionCacheReset />
            <ApiClientProvider>
              <HashbangRouter>
                <AppShell />
              </HashbangRouter>
            </ApiClientProvider>
          </QueryClientProvider>
        </AuthProvider>
      </I18nProvider>
    </MantineProvider>
  );
}
