import { Container } from "@mantine/core";

import { AppFooter } from "./AppFooter";
import { AppNavbar } from "./AppNavbar";
import { AutoCreateRealmDialog } from "./AutoCreateRealmDialog";
import { DebugModeAlerts } from "./DebugModeAlerts";
import { IdleCountdownAlert } from "./IdleCountdownAlert";
import { LockScreenDialog } from "./LockScreenDialog";
import { NoTokenDialog } from "./NoTokenDialog";
import { useIdleCountdown } from "./useIdleCountdown";
import { useMainHotkeys } from "./useMainHotkeys";
import { usePostLoginDialogs } from "./usePostLoginDialogs";
import { AppRoutes } from "@/app/routes";
import { useAuth } from "@/auth/AuthProvider";

/**
 * Port of the legacy `mainController` frame: navigation, footer, the debug
 * and idle banners, the hotkeys and the dialogs that follow a login (lock
 * screen, "no token", "create default realm").
 */
export function AppShell() {
  const { logLevel } = useAuth();
  const dialogs = usePostLoginDialogs();
  const countdown = useIdleCountdown();

  useMainHotkeys();

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
        <DebugModeAlerts logLevel={logLevel} />
        <IdleCountdownAlert countdown={countdown} />
        <AppRoutes />
      </Container>
      <AppFooter />
      <LockScreenDialog />
      <NoTokenDialog
        onClose={dialogs.noToken.onClose}
        opened={dialogs.noToken.opened}
      />
      <AutoCreateRealmDialog
        onClose={dialogs.realm.onClose}
        opened={dialogs.realm.opened}
      />
    </>
  );
}
