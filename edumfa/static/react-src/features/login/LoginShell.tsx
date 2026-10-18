import { Box, Container } from "@mantine/core";
import type { PropsWithChildren } from "react";

/** The narrow centred column of the legacy `form-signin` views. */
export function LoginShell({ children }: PropsWithChildren) {
  return (
    <Box className="react-migration-shell">
      <Container size="xs">{children}</Container>
    </Box>
  );
}
