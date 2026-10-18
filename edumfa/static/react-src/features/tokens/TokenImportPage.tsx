import { Trans } from "@lingui/react/macro";
import { NativeSelect } from "@mantine/core";

import { FileTypeHelp } from "./import/FileTypeHelp";
import { PgpKeyList } from "./import/PgpKeyList";
import { PskcOptions } from "./import/PskcOptions";
import { TokenImportButton } from "./import/TokenImportButton";
import { TokenImportResultCard } from "./import/TokenImportResultCard";
import { useTokenImport } from "./import/useTokenImport";
import { useTokenImportConfig } from "./import/useTokenImportConfig";
import { TokenSidebar } from "./TokenSidebar";
import { type TokenImportFileType } from "@/api/tokens";
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
  const { isAuthenticated } = useAuth();
  const { defaultRealm, pgpKeysQuery, realmNames, realmsQuery } =
    useTokenImportConfig();
  const tokenImport = useTokenImport(defaultRealm);
  const { fileType, uploadMutation } = tokenImport;

  return (
    <SidebarLayout sidebar={<TokenSidebar activeItem="import" />}>
      <PageHeader title={<Trans>Import tokens from a file</Trans>} />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={realmsQuery.error} />
      <ErrorAlert error={pgpKeysQuery.error} />
      <ErrorAlert error={uploadMutation.error} />

      <Card
        footer={
          <TokenImportButton
            loading={uploadMutation.isPending}
            onSelect={uploadMutation.mutate}
          />
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
            tokenImport.setFileType(event.currentTarget.value as TokenImportFileType);
          }}
          value={fileType}
        />

        <FileTypeHelp fileType={fileType} />

        {fileType === "pskc" ? (
          <PskcOptions
            password={tokenImport.password}
            psk={tokenImport.psk}
            setPassword={tokenImport.setPassword}
            setPsk={tokenImport.setPsk}
            setValidateMac={tokenImport.setValidateMac}
            validateMac={tokenImport.validateMac}
          />
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
            tokenImport.setSelectedRealm(event.currentTarget.value);
          }}
          value={tokenImport.activeRealm}
        />

        <PgpKeyList pgpKeys={pgpKeysQuery.data} />
      </Card>

      {tokenImport.uploadedFile && tokenImport.result ? (
        <TokenImportResultCard
          result={tokenImport.result}
          uploadedFile={tokenImport.uploadedFile}
        />
      ) : null}
    </SidebarLayout>
  );
}
