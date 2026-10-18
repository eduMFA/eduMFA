import { useLingui } from "@lingui/react/macro";
import { SimpleGrid, TextInput } from "@mantine/core";

import type { SystemConfigCardProps } from "./systemConfigForm";
import { Card } from "@/components/layout/Card";

/** The "newly enrolled tokens" box of `config.system.edit.html`. */
export function TokenDefaultsCard({ form, onChange }: SystemConfigCardProps) {
  const { t } = useLingui();

  return (
    <Card title={t`Newly enrolled tokens`}>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        <TextInput
          id="DefaultOtpLen"
          inputMode="numeric"
          label={t`OTP length of newly enrolled tokens`}
          onChange={(event) => {
            onChange({ DefaultOtpLen: event.currentTarget.value });
          }}
          placeholder="6"
          value={form.DefaultOtpLen}
        />
        <TextInput
          id="DefaultCountWindow"
          inputMode="numeric"
          label={t`Count Window of newly enrolled tokens`}
          onChange={(event) => {
            onChange({ DefaultCountWindow: event.currentTarget.value });
          }}
          placeholder="10"
          value={form.DefaultCountWindow}
        />
        <TextInput
          id="DefaultMaxFailCount"
          inputMode="numeric"
          label={t`Max Failcount of newly enrolled tokens`}
          onChange={(event) => {
            onChange({ DefaultMaxFailCount: event.currentTarget.value });
          }}
          placeholder="10"
          value={form.DefaultMaxFailCount}
        />
        <TextInput
          id="DefaultSyncWindow"
          inputMode="numeric"
          label={t`Sync Window of newly enrolled tokens`}
          onChange={(event) => {
            onChange({ DefaultSyncWindow: event.currentTarget.value });
          }}
          placeholder="1000"
          value={form.DefaultSyncWindow}
        />
        <TextInput
          id="DefaultChallengeValidityTime"
          inputMode="numeric"
          label={t`The challenge validity time`}
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
