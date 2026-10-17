import { Trans } from "@lingui/react/macro";
import { Alert, Anchor, Button, Stack, Text } from "@mantine/core";
import { IconCircleCheck, IconEyeOff, IconSearch } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { TokenSidebar } from "./TokenSidebar";
import { useApiClient } from "@/api/ApiClientProvider";
import { markTokenLost, tokenQueryKeys } from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { hashHref } from "@/lib/hashbang";

/**
 * Port of `token.lost.html`: marks a token as lost, which enrolls a
 * temporary password token and disables the old one. The generated
 * password is shown once.
 */
export function TokenLostPage() {
  const { serial = "" } = useParams();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const lostMutation = useMutation({
    mutationFn: () => markTokenLost(apiClient, serial),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tokenQueryKeys.all });
    }
  });
  const result = lostMutation.data ?? null;
  const detailsHref = hashHref(`/token/details/${encodeURIComponent(serial)}`);

  return (
    <SidebarLayout sidebar={<TokenSidebar activeItem="lost" serial={serial} />}>
      <PageHeader
        actions={
          <Button
            component="a"
            href={hashHref(`/audit/log?serial=${encodeURIComponent(serial)}`)}
            leftSection={<IconSearch size={16} />}
            variant="default"
          >
            <Trans>View token in Audit log</Trans>
          </Button>
        }
        title={<Trans>Token {serial} is lost?</Trans>}
      />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={lostMutation.error} />

      <Card
        footer={
          result ? undefined : (
            <Button
              id="lostTokenButton"
              leftSection={<IconEyeOff size={16} />}
              loading={lostMutation.isPending}
              onClick={() => {
                lostMutation.mutate();
              }}
            >
              <Trans>Mark the token as lost</Trans>
            </Button>
          )
        }
      >
        <Stack gap="sm">
          <Text size="sm">
            <Trans>
              If the token is lost, you can enroll a temporary password based token and
              give the password to the user. The OTP PIN of the old token is still the
              same.
            </Trans>
          </Text>
          <Text size="sm">
            <Trans>
              The user will have to authenticate with the old OTP PIN he knows and this
              newly generated password.
            </Trans>
          </Text>
          <Text size="sm">
            <Trans>
              The old token{" "}
              <Anchor href={detailsHref} size="sm">
                {serial}
              </Anchor>{" "}
              will be disabled and can be deleted or enabled later.
            </Trans>
          </Text>
        </Stack>
      </Card>

      {result ? (
        <Alert
          color="green"
          icon={<IconCircleCheck size={18} />}
          mb="md"
          role="status"
          title={<Trans>The token was marked lost successfully.</Trans>}
          variant="light"
        >
          <Stack gap="xs">
            <Text size="sm">
              <Trans>
                The serial of the new token is{" "}
                <Anchor
                  href={hashHref(`/token/details/${encodeURIComponent(result.serial)}`)}
                  size="sm"
                >
                  {result.serial}
                </Anchor>
                .
              </Trans>
            </Text>
            <Text size="sm">
              <Trans>
                The password that needs to be combined with the OTP PIN:{" "}
                <Text component="b" data-field="lostPassword" ff="monospace">
                  {result.password}
                </Text>
              </Trans>
            </Text>
            <Text size="sm">
              <Trans>The password can not be shown again, later!</Trans>
            </Text>
            <Text size="sm">
              <Trans>The token is valid till {result.end_date}.</Trans>
            </Text>
          </Stack>
        </Alert>
      ) : null}
    </SidebarLayout>
  );
}
