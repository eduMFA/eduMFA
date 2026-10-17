import { Trans } from "@lingui/react/macro";
import { SimpleGrid, TextInput } from "@mantine/core";

import type { SystemConfigCardProps } from "./systemConfigForm";
import { Card } from "@/components/layout/Card";

/** The "newly enrolled tokens" box of `config.system.edit.html`. */
export function TokenDefaultsCard({ form, onChange }: SystemConfigCardProps) {
  return (
    <Card title={<Trans>Newly enrolled tokens</Trans>}>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        <TextInput
          id="DefaultOtpLen"
          inputMode="numeric"
          label={<Trans>OTP length of newly enrolled tokens</Trans>}
          onChange={(event) => {
            onChange({ DefaultOtpLen: event.currentTarget.value });
          }}
          placeholder="6"
          value={form.DefaultOtpLen}
        />
        <TextInput
          id="DefaultCountWindow"
          inputMode="numeric"
          label={<Trans>Count Window of newly enrolled tokens</Trans>}
          onChange={(event) => {
            onChange({ DefaultCountWindow: event.currentTarget.value });
          }}
          placeholder="10"
          value={form.DefaultCountWindow}
        />
        <TextInput
          id="DefaultMaxFailCount"
          inputMode="numeric"
          label={<Trans>Max Failcount of newly enrolled tokens</Trans>}
          onChange={(event) => {
            onChange({ DefaultMaxFailCount: event.currentTarget.value });
          }}
          placeholder="10"
          value={form.DefaultMaxFailCount}
        />
        <TextInput
          id="DefaultSyncWindow"
          inputMode="numeric"
          label={<Trans>Sync Window of newly enrolled tokens</Trans>}
          onChange={(event) => {
            onChange({ DefaultSyncWindow: event.currentTarget.value });
          }}
          placeholder="1000"
          value={form.DefaultSyncWindow}
        />
        <TextInput
          id="DefaultChallengeValidityTime"
          inputMode="numeric"
          label={<Trans>The challenge validity time</Trans>}
          onChange={(event) => {
            onChange({ DefaultChallengeValidityTime: event.currentTarget.value });
          }}
          placeholder="120"
          value={form.DefaultChallengeValidityTime}
        />
      </SimpleGrid>
    </Card>
  );
}
