import { useLingui } from "@lingui/react/macro";
import { Anchor, Box, Container, Group, Text, UnstyledButton } from "@mantine/core";
import { useState } from "react";

import { AboutDialog } from "./AboutDialog";
import { useAuth } from "@/auth/AuthProvider";
import { getUiConfig } from "@/lib/uiConfig";

/**
 * Port of `templates/baseline.html`: the dark bar with the version number
 * (opens the About dialog) and the privacy statement link of the
 * `gdpr_link` policy.
 */
export function AppFooter() {
  const { t } = useLingui();

  const { versionNumber } = useAuth();
  const [aboutOpen, setAboutOpen] = useState(false);
  const { gdprLink } = getUiConfig();

  return (
    <Box className="app-footer" component="footer" mt="auto">
      <Container py="sm" size="xl">
        <Group justify="space-between">
          <UnstyledButton
            onClick={() => {
              setAboutOpen(true);
            }}
          >
            <Text c="gray.4" size="sm">
              eduMFA {versionNumber ?? ""}
            </Text>
          </UnstyledButton>
          {gdprLink ? (
            <Anchor c="gray.4" href={gdprLink} rel="noopener" size="sm" target="_blank">
              {t`Privacy statement`}
            </Anchor>
          ) : null}
        </Group>
      </Container>
      <AboutDialog
        onClose={() => {
          setAboutOpen(false);
        }}
        opened={aboutOpen}
      />
    </Box>
  );
}
