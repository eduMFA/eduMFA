import { Box } from "@mantine/core";
import type { PropsWithChildren } from "react";

import type { EnrollMode } from "./enrollForm";
import { useAuth } from "@/auth/AuthProvider";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { TokenSidebar } from "@/features/tokens/TokenSidebar";

export interface EnrollTokenLayoutProps {
  mode: EnrollMode;
}

/**
 * The token sidebar around the page. The wizard hides the token navigation
 * when the `token_wizard` policy sends users straight here
 * (`ng-hide="token_wizard"` in token.html).
 */
export function EnrollTokenLayout({
  children,
  mode
}: PropsWithChildren<EnrollTokenLayoutProps>) {
  const { settings } = useAuth();
  const isWizard = mode === "wizard";

  if (isWizard && settings.tokenWizard) {
    return (
      <Box className="react-migration-shell">
        <main>{children}</main>
      </Box>
    );
  }

  return (
    <SidebarLayout
      sidebar={<TokenSidebar activeItem={isWizard ? "wizard" : "enroll"} />}
    >
      {children}
    </SidebarLayout>
  );
}
