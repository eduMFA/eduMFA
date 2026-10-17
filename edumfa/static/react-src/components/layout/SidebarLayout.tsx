import { Box, Grid, Paper } from "@mantine/core";
import type { PropsWithChildren, ReactNode } from "react";

export interface SidebarLayoutProps {
  sidebar: ReactNode;
}

/**
 * Two-column shell replacing the legacy `user.html` / `machine.html` parent
 * views: a sticky navigation card on the left and the routed page on the
 * right. Collapses to one column on narrow screens.
 */
export function SidebarLayout({
  children,
  sidebar
}: PropsWithChildren<SidebarLayoutProps>) {
  return (
    <Box className="react-migration-shell">
      <Grid align="flex-start" className="sidebar-layout" gap="lg">
        <Grid.Col span={{ base: 12, lg: 3 }}>
          <Paper
            className="sidebar-navigation"
            component="nav"
            p="xs"
            pos="sticky"
            radius="md"
            shadow="xs"
            top={12}
            withBorder
          >
            {sidebar}
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 9 }}>
          <main>{children}</main>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
