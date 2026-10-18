import { Box, Container, Group, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";

import { GuestLinks } from "./GuestLinks";
import { LegacyUiSwitch } from "./LegacyUiSwitch";
import { MainMenu } from "./MainMenu";
import { NavbarBrand } from "./NavbarBrand";
import { RefreshButton } from "./RefreshButton";
import { SessionMenu } from "./SessionMenu";
import { useApiClient } from "@/api/ApiClientProvider";
import { getRegisterStatus } from "@/api/register";
import { useAuth } from "@/auth/AuthProvider";
import { getUiConfig } from "@/lib/uiConfig";

/**
 * Port of `templates/menu.html`: the brand, the main menu per role and
 * menu policy, the node name, the refresh button and the session menu with
 * lock screen and logout. The main menu is hidden in the token wizard.
 */
export function AppNavbar() {
  const apiClient = useApiClient();
  const { isAuthenticated, isLocked, settings, user } = useAuth();
  const uiConfig = getUiConfig();
  const registrationQuery = useQuery({
    queryFn: ({ signal }) => getRegisterStatus(apiClient, signal),
    queryKey: ["register", "status"],
    staleTime: Infinity
  });
  const loggedIn = Boolean(user) && (isAuthenticated || isLocked);
  const nodeName = settings.showNode || uiConfig.showNode;

  return (
    <Box className="app-navbar" component="header">
      <Container className="app-navbar-inner" py={8} size="xl">
        <Group gap="xs" justify="space-between" wrap="wrap">
          <Group gap={4} wrap="wrap">
            <NavbarBrand loggedIn={loggedIn} />
            {settings.tokenWizard ? null : <MainMenu loggedIn={loggedIn} />}
          </Group>
          <Group gap="xs" wrap="wrap">
            <LegacyUiSwitch />
            {nodeName ? (
              <Text fw={700} size="sm">
                {nodeName}
              </Text>
            ) : null}
            {loggedIn ? <RefreshButton /> : null}
            {loggedIn ? null : (
              <GuestLinks canRegister={registrationQuery.data === true} />
            )}
            {loggedIn && user ? <SessionMenu user={user} /> : null}
          </Group>
        </Group>
      </Container>
    </Box>
  );
}
