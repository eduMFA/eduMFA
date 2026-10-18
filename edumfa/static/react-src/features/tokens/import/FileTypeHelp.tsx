import { Trans } from "@lingui/react/macro";
import { Stack, Text } from "@mantine/core";

import { type TokenImportFileType } from "@/api/tokens";

/** The per-format explanations from the legacy template. */
export function FileTypeHelp({ fileType }: { fileType: TokenImportFileType }) {
  if (fileType === "aladdin-xml") {
    return (
      <Text c="dimmed" mb="sm" size="sm">
        <Trans>
          Here you can upload an XML file from Aladdin or SafeNet as it was used with
          Aladdin TMS or SafeNet SAM.
        </Trans>
      </Text>
    );
  }

  if (fileType === "OATH CSV") {
    return (
      <Stack c="dimmed" gap={4} mb="sm">
        <Text size="sm">
          <Trans>
            Here you can upload a csv file for your OATH token. The file is supposed to
            contain one token per line.
          </Trans>
        </Text>
        <Text size="sm">
          <Trans>For HOTP and TOTP tokens:</Trans>
        </Text>
        <Text fs="italic" pl="md" size="sm">
          <Trans>serial number, seed, type, otplen, timeStep</Trans>
        </Text>
        <Text size="sm">
          <Trans>For OCRA tokens:</Trans>
        </Text>
        <Text fs="italic" pl="md" size="sm">
          <Trans>serial number, seed, type, ocrasuite</Trans>
        </Text>
        <Text size="sm">
          <Trans>
            type (default hotp), otplen (default 6), timeStep (default 30) and ocrasuite
            are optional.
          </Trans>
        </Text>
      </Stack>
    );
  }

  if (fileType === "Yubikey CSV") {
    return (
      <Stack c="dimmed" gap={4} mb="sm">
        <Text size="sm">
          <Trans>
            Here you can upload a csv file for your Yubikey token. The file is supposed
            to contain one token per line.
          </Trans>
        </Text>
        <Text size="sm">
          <Trans>
            If you are enrolling the Yubikey in HOTP mode, you should use the PSKC file
            format in the newer version of the Yubikey GUI.
          </Trans>
        </Text>
      </Stack>
    );
  }

  return (
    <Stack c="dimmed" gap={4} mb="sm">
      <Text size="sm">
        <Trans>
          This is an RFC6030 OATH compliant PSKC file. Values in the PSKC files may be
          unencrypted or <em>either</em> encrypted with a <em>Pre Shared Key</em> or{" "}
          <em>password</em>. If the values are encrypted, please specify the Pre Shared
          Key in hex format or the password.
        </Trans>
      </Text>
      <Text size="sm">
        <Trans>
          As the values are encrypted with AES128-CBC, you need to give a 32 characters
          long hex string.
        </Trans>
      </Text>
    </Stack>
  );
}
