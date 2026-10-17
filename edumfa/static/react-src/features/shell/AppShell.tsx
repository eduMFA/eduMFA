import { Trans } from "@lingui/react/macro";
import { Alert, Container } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppFooter } from "./AppFooter";
import { AppNavbar } from "./AppNavbar";
import { AutoCreateRealmDialog } from "./AutoCreateRealmDialog";
import { LockScreenDialog } from "./LockScreenDialog";
import { NoTokenDialog } from "./NoTokenDialog";
import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, getRealms } from "@/api/config";
import { AppRoutes } from "@/app/routes";
import { useAuth } from "@/auth/AuthProvider";
import { useIdleWatch } from "@/auth/useIdleWatch";

/**
 * Port of the legacy `mainController` frame: navigation, footer, the debug
 * and idle banners, the hotkeys and the dialogs that follow a login (lock
 * screen, "no token", "create default realm").
 */
export function AppShell() {
  const apiClient = useApiClient();
  const navigate = useNavigate();
  const {
    authToken,
    isAuthenticated,
    isLocked,
    lock,
    logLevel,
    logout,
    settings,
    user
  } = useAuth();
  const isAdmin = user?.role === "admin";
  const isUser = user?.role === "user";
  // Each dialog is shown once per session, like the legacy scope flags.
  const [noTokenDismissedFor, setNoTokenDismissedFor] = useState<string | null>(null);
  const [realmDialogDismissedFor, setRealmDialogDismissedFor] = useState<string | null>(
    null
  );

  const realmsQuery = useQuery({
    enabled: isAuthenticated && isAdmin,
    queryFn: ({ signal }) => getRealms(apiClient, signal),
    queryKey: configQueryKeys.realms
  });
  const showRealmDialog =
    isAuthenticated &&
    isAdmin &&
    realmsQuery.data !== undefined &&
    Object.keys(realmsQuery.data).length === 0 &&
    realmDialogDismissedFor !== authToken;
  const showNoTokenDialog =
    isAuthenticated &&
    isUser &&
    settings.dialogNoToken &&
    noTokenDismissedFor !== authToken;

  const handleIdleTimeout = useCallback(() => {
    if (settings.timeoutAction === "logout") {
      logout();
    } else {
      lock();
    }
  }, [lock, logout, settings.timeoutAction]);
  const countdown = useIdleWatch({
    enabled: isAuthenticated && !isLocked,
    idleSeconds: Math.max(settings.logoutTime - 10, 1),
    onTimeout: handleIdleTimeout
  });

  // The hotkeys of the legacy main controller.
  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "e") {
        event.preventDefault();
        void navigate("/token/enroll");
      } else if (key === "l") {
        event.preventDefault();
        void navigate("/token/list");
      } else if (key === "q") {
        event.preventDefault();
        logout();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAuthenticated, logout, navigate]);

  return (
    <>
      <AppNavbar />
      <Container
        className="app-main"
        component="main"
        size="xl"
        style={{ flex: 1 }}
        w="100%"
      >
        {logLevel === 10 ? (
          <Alert color="yellow" mt="md" role="alert" variant="light">
            <Trans>
              eduMFA is running in DEBUG mode. You can change the debug level in
              edumfa.cfg.
            </Trans>
          </Alert>
        ) : null}
        {logLevel !== null && logLevel < 10 ? (
          <Alert color="red" mt="md" role="alert" variant="light">
            <Trans>
              eduMFA is running in DEBUG mode with PASSWORDS being written to the log
              file. You can change the debug level in edumfa.cfg. Afterwards be sure to
              remove the logfile!
            </Trans>
          </Alert>
        ) : null}
        {countdown !== null ? (
          <Alert color="yellow" mt="md" role="alert" variant="light">
            <Trans>You will be logged out in {countdown} second(s).</Trans>
          </Alert>
        ) : null}
        <AppRoutes />
      </Container>
      <AppFooter />
      <LockScreenDialog />
      <NoTokenDialog
        onClose={() => {
          setNoTokenDismissedFor(authToken);
        }}
        opened={showNoTokenDialog}
      />
      <AutoCreateRealmDialog
        onClose={() => {
          setRealmDialogDismissedFor(authToken);
        }}
        opened={showRealmDialog}
      />
    </>
  );
}
