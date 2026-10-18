import { useLingui } from "@lingui/react/macro";
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
  const { t } = useLingui();

  return (
    <>
      <TextInput
        label={t`Interval`}
        required
        leftSection={<IconCalendarTime aria-hidden size={16} />}
        description={t`Use crontab notation: minute, hour, day of month, month, day of week.`}
        placeholder="*/10 * * * *"
        value={value}
        onChange={(event) => {
          onChange(event.currentTarget.value);
        }}
      />
      <Text size="sm" c="dimmed">
        <Code>*/10 * * * *</Code> {t`Every ten minutes`}
        <br />
        <Code>5 10 * * *</Code> {t`Every day at 10:05`}
      </Text>
    </>
  );
}
