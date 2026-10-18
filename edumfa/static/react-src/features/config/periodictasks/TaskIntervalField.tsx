import { Trans } from "@lingui/react/macro";
import { Code, Text, TextInput } from "@mantine/core";
import { IconCalendarTime } from "@tabler/icons-react";

/** Crontab interval input with two examples underneath. */
export function TaskIntervalField({
  onChange,
  value
}: {
  onChange: (interval: string) => void;
  value: string;
}) {
  return (
    <>
      <TextInput
        label={<Trans>Interval</Trans>}
        required
        leftSection={<IconCalendarTime aria-hidden size={16} />}
        description={
          <Trans>
            Use crontab notation: minute, hour, day of month, month, day of week.
          </Trans>
        }
        placeholder="*/10 * * * *"
        value={value}
        onChange={(event) => {
          onChange(event.currentTarget.value);
        }}
      />
      <Text size="sm" c="dimmed">
        <Code>*/10 * * * *</Code> <Trans>Every ten minutes</Trans>
        <br />
        <Code>5 10 * * *</Code> <Trans>Every day at 10:05</Trans>
      </Text>
    </>
  );
}
