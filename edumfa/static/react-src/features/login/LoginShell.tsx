import { Box, Center, Container } from "@mantine/core";
import type { PropsWithChildren } from "react";

/** The narrow centred column of the legacy `form-signin` views. */
export function LoginShell({ children }: PropsWithChildren) {
  return (
    <Box className="react-migration-shell">
      <Container size="xs">{children}</Container>
    </Box>
  );
}

export interface LoginLogoProps {
  url: string | null;
}

/** The instance logo above the sign-in heading (`EDUMFA_LOGO`). */
export function LoginLogo({ url }: LoginLogoProps) {
  if (!url) {
    return null;
  }

  return (
    <Center mb="md">
      <img alt="" src={url} width={90} />
    </Center>
  );
}
