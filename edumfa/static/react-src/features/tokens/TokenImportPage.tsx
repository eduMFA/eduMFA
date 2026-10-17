import { Trans, useLingui } from "@lingui/react/macro";
import {
  Accordion,
  Button,
  FileButton,
  NativeSelect,
  PasswordInput,
  Stack,
  Table,
  Text,
  TextInput
} from "@mantine/core";
import { IconUpload } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { TokenSidebar } from "./TokenSidebar";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  configQueryKeys,
  getDefaultRealmName,
  getPgpKeys,
  getRealms
} from "@/api/config";
import {
  importTokens,
  tokenQueryKeys,
  type PskcValidateMac,
  type TokenImportFileType,
  type TokenImportResult
} from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

const fileTypes: TokenImportFileType[] = [
  "aladdin-xml",
  "OATH CSV",
  "Yubikey CSV",
  "pskc"
];

/**
 * Port of `token.import.html`. The file is uploaded as soon as it is picked,
 * like the legacy `ngf-select="upload($file)"`. The legacy progress
 * percentage is not available with `fetch`; the button shows a loading
 * state instead.
 */
export function TokenImportPage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { t } = useLingui();
  const { isAuthenticated } = useAuth();
  const [fileType, setFileType] = useState<TokenImportFileType>("OATH CSV");
  const [psk, setPsk] = useState("");
  const [password, setPassword] = useState("");
  const [validateMac, setValidateMac] = useState<PskcValidateMac | "">("");
  const [selectedRealm, setSelectedRealm] = useState("");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [result, setResult] = useState<TokenImportResult | null>(null);

  const realmsQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getRealms(apiClient, signal),
    queryKey: configQueryKeys.realms
  });
  const pgpKeysQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getPgpKeys(apiClient, signal),
    queryKey: configQueryKeys.pgpKeys
  });

  const realmNames = Object.keys(realmsQuery.data ?? {}).sort((left, right) =>
    left.localeCompare(right)
  );
  const defaultRealm = realmsQuery.data
    ? (getDefaultRealmName(realmsQuery.data) ?? "")
    : "";
  const activeRealm = selectedRealm || defaultRealm;
  const pgpKeys = Object.entries(pgpKeysQuery.data ?? {});

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      importTokens(apiClient, file, {
        fileType,
        realm: activeRealm,
        ...(fileType === "pskc"
          ? {
              password,
              psk,
              ...(validateMac ? { pskcValidateMac: validateMac } : {})
            }
          : {})
      }),
    onSuccess: async (importResult, file) => {
      setUploadedFile(file.name);
      setResult(importResult);
      await queryClient.invalidateQueries({ queryKey: tokenQueryKeys.all });
    }
  });

  const validateMacOptions = [
    { label: "", value: "" },
    { label: t`Do not verify the authenticity`, value: "no_check" },
    { label: t`Skip tokens that can not be verified`, value: "check_fail_soft" },
    { label: t`Abort operation on unverifiable token`, value: "check_fail_hard" }
  ];

  return (
    <SidebarLayout sidebar={<TokenSidebar activeItem="import" />}>
      <PageHeader title={<Trans>Import tokens from a file</Trans>} />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={realmsQuery.error} />
      <ErrorAlert error={pgpKeysQuery.error} />
      <ErrorAlert error={uploadMutation.error} />

      <Card
        footer={
          <FileButton
            onChange={(file) => {
              if (file) {
                uploadMutation.mutate(file);
              }
            }}
          >
            {(buttonProps) => (
              <Button
                {...buttonProps}
                id="importButton"
                leftSection={<IconUpload size={16} />}
                loading={uploadMutation.isPending}
              >
                <Trans>Select file and import</Trans>
              </Button>
            )}
          </FileButton>
        }
        footerAlign="center"
        title={<Trans>Token file</Trans>}
      >
        <NativeSelect
          data={fileTypes}
          id="filetype"
          label={<Trans>File type</Trans>}
          mb="sm"
          onChange={(event) => {
            setFileType(event.currentTarget.value as TokenImportFileType);
          }}
          value={fileType}
        />

        <FileTypeHelp fileType={fileType} />

        {fileType === "pskc" ? (
          <Stack gap="sm" mb="sm">
            <TextInput
              id="psk"
              label={<Trans>Pre Shared Key</Trans>}
              maxLength={32}
              onChange={(event) => {
                setPsk(event.currentTarget.value);
                setPassword("");
              }}
              placeholder={t`Pre Shared Key`}
              value={psk}
            />
            <PasswordInput
              id="pskcPassword"
              label={<Trans>Password</Trans>}
              onChange={(event) => {
                setPassword(event.currentTarget.value);
                setPsk("");
              }}
              placeholder={t`Password`}
              value={password}
            />
            <NativeSelect
              data={validateMacOptions}
              description={
                <Trans>
                  You can choose how the authenticity of the tokens to be imported
                  should be verified.
                </Trans>
              }
              id="pskcValidateMAC"
              label={<Trans>Verification</Trans>}
              onChange={(event) => {
                setValidateMac(event.currentTarget.value as PskcValidateMac | "");
              }}
              value={validateMac}
            />
          </Stack>
        ) : null}

        <NativeSelect
          data={[{ label: "", value: "" }, ...realmNames]}
          description={
            <Trans>
              You can choose a realm to which the tokens should be imported. You can
              also change the realms of each token later.
            </Trans>
          }
          id="importRealm"
          label={<Trans>Realm</Trans>}
          mb="sm"
          onChange={(event) => {
            setSelectedRealm(event.currentTarget.value);
          }}
          value={activeRealm}
        />

        {pgpKeys.length > 0 ? (
          <Accordion multiple variant="separated">
            {pgpKeys.map(([keyId, key]) => (
              <Accordion.Item key={keyId} value={keyId}>
                <Accordion.Control>
                  <Trans>PGP Key</Trans> {keyId}
                </Accordion.Control>
                <Accordion.Panel>
                  <Text mb="xs" size="sm">
                    <Trans>
                      Please pass the public key and the fingerprint to the token
                      provider.
                    </Trans>
                  </Text>
                  <Text
                    component="pre"
                    ff="monospace"
                    size="xs"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {key.armor}
                  </Text>
                  <Text size="sm">
                    <Trans>Fingerprint</Trans>: {key.fingerprint}
                  </Text>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        ) : null}
      </Card>

      {uploadedFile && result ? (
        <Card flush title={<Trans>Import result</Trans>}>
          <Table verticalSpacing="sm">
            <Table.Tbody>
              <Table.Tr>
                <Table.Td fw={600} w="40%">
                  <Trans>Uploaded File</Trans>
                </Table.Td>
                <Table.Td data-field="uploadedFile">{uploadedFile}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={600}>
                  <Trans>Uploaded Tokens</Trans>
                </Table.Td>
                <Table.Td data-field="uploadedTokens">{result.n_imported}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={600}>
                  <Trans>Skipped Tokens</Trans>
                </Table.Td>
                <Table.Td data-field="skippedTokens">{result.n_not_imported}</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Card>
      ) : null}
    </SidebarLayout>
  );
}

/** The per-format explanations from the legacy template. */
function FileTypeHelp({ fileType }: { fileType: TokenImportFileType }) {
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
