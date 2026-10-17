import { Trans, useLingui } from "@lingui/react/macro";
import { NativeSelect, SegmentedControl, Text, Textarea } from "@mantine/core";

import { SectionTitle } from "./SectionTitle";
import { type TokenTypeFieldsProps } from "./types";
import { type CertificateMode } from "@/features/tokens/enroll/enrollForm";

export function CertificateFields({ form, lookups, onChange }: TokenTypeFieldsProps) {
  const { t } = useLingui();
  const connector = lookups.caConnectors.find(
    (candidate) => candidate.connectorname === form.ca
  );
  const templates = connector?.templates ?? {};
  const templateNames = Object.keys(templates);
  const templateDescription = templates[form.template];
  const modeOptions: { label: string; value: CertificateMode }[] = [
    { label: t`Generate Request`, value: "csrgenerate" },
    { label: t`Upload Request`, value: "csrupload" },
    { label: t`Upload Certificate`, value: "certupload" }
  ];

  return (
    <>
      <SectionTitle>
        <Trans>Token data</Trans>
      </SectionTitle>
      <SegmentedControl
        data={modeOptions}
        mb="sm"
        onChange={(value) => {
          onChange({ certificateMode: value });
        }}
        value={form.certificateMode}
      />
      <NativeSelect
        data={lookups.caConnectors.map((candidate) => candidate.connectorname)}
        id="ca"
        label={<Trans>CA Connector</Trans>}
        mb="sm"
        onChange={(event) => {
          onChange({ ca: event.currentTarget.value, template: "" });
        }}
        value={form.ca}
      />
      <NativeSelect
        data={["", ...templateNames]}
        description={
          typeof templateDescription === "string" ? templateDescription : undefined
        }
        id="template"
        label={<Trans>Certificate Template</Trans>}
        mb="sm"
        onChange={(event) => {
          onChange({ template: event.currentTarget.value });
        }}
        value={form.template}
      />
      {form.certificateMode === "certupload" ? (
        <Textarea
          autosize
          id="certificate"
          label={<Trans>Certificate (PEM)</Trans>}
          mb="sm"
          minRows={5}
          onChange={(event) => {
            onChange({ certificate: event.currentTarget.value });
          }}
          placeholder={t`Paste the Certificate`}
          value={form.certificate}
        />
      ) : null}
      {form.certificateMode === "csrupload" ? (
        <Textarea
          autosize
          id="request"
          label={<Trans>Certificate Signing Request (PEM)</Trans>}
          mb="sm"
          minRows={5}
          onChange={(event) => {
            onChange({ certificateRequest: event.currentTarget.value });
          }}
          placeholder={t`Paste the Certificate Signing Request`}
          value={form.certificateRequest}
        />
      ) : null}
      {form.certificateMode === "csrgenerate" ? (
        <Text c="dimmed" mb="sm" size="sm">
          <Trans>
            The server will create the private RSA key and store it in the database. You
            can later download the PKCS#12 file.
          </Trans>
        </Text>
      ) : null}
    </>
  );
}
