import { Trans, useLingui } from "@lingui/react/macro";
import { Textarea } from "@mantine/core";

import { SectionTitle } from "./SectionTitle";
import { type TokenTypeFieldsProps } from "./types";
import { getSshKeyComment } from "@/features/tokens/enroll/enrollForm";

export function SshKeyFields({ form, onChange }: TokenTypeFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <SectionTitle>
        <Trans>Token data</Trans>
      </SectionTitle>
      <Textarea
        autosize
        id="sshkey"
        label={<Trans>SSH public Key</Trans>}
        mb="sm"
        minRows={5}
        onChange={(event) => {
          const sshkey = event.currentTarget.value;

          onChange({ description: getSshKeyComment(sshkey), sshkey });
        }}
        placeholder={t`Paste the ssh PUBLIC key`}
        value={form.sshkey}
      />
    </>
  );
}
