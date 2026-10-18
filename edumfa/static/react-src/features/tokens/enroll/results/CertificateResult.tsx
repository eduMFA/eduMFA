import { useLingui } from "@lingui/react/macro";
import { Button, Group, Stack, Text } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";

import { type EnrolledTokenResultProps } from "./types";

export function CertificateResult({ detail, rolloutState }: EnrolledTokenResultProps) {
  const { t } = useLingui();

  const certificateHref = detail.certificate
    ? `data:application/x-pem-file;charset=utf-8,${encodeURIComponent(detail.certificate)}`
    : null;
  const pkcs12Href = detail.pkcs12
    ? `data:application/x-pkcs12;base64,${detail.pkcs12}`
    : null;

  return (
    <Stack gap="sm">
      {detail.certificate ? (
        <Text size="sm">{t`The certificate was enrolled successfully.`}</Text>
      ) : null}
      {rolloutState === "pending" ? (
        <Text size="sm">
          {t`Your certificate request is taken under submission and waiting for administrative approval.`}
        </Text>
      ) : null}
      {rolloutState === "failed" ? (
        <Text c="red" size="sm">
          {t`Your CSR to the certificate authority failed.`}
        </Text>
      ) : null}
      <Group gap="sm">
        {certificateHref ? (
          <Button
            component="a"
            download={`${detail.serial}.pem`}
            href={certificateHref}
            leftSection={<IconDownload size={16} />}
            variant="default"
          >
            {t`Download the certificate`}
          </Button>
        ) : null}
        {pkcs12Href ? (
          <Button
            component="a"
            download={`${detail.serial}.p12`}
            href={pkcs12Href}
            leftSection={<IconDownload size={16} />}
            variant="default"
          >
            {t`Download the PKCS12 file`}
          </Button>
        ) : null}
      </Group>
      {detail.certificate ? (
        <Text
          component="pre"
          ff="monospace"
          size="xs"
          style={{ whiteSpace: "pre-wrap" }}
        >
          {detail.certificate}
        </Text>
      ) : null}
    </Stack>
  );
}
