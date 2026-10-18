import { Trans, useLingui } from "@lingui/react/macro";
import { Button, Group, Stack, Text, TextInput } from "@mantine/core";

export interface VerifyTokenFieldsProps {
  isVerifying: boolean;
  /** The backend's prompt (`detail.verify.message`), if it sent one. */
  message: string | undefined;
  onChange: (value: string) => void;
  onVerify: () => void;
  value: string;
}

/** The verification code step of a token enrolled with `verify_enrollment`. */
export function VerifyTokenFields({
  isVerifying,
  message,
  onChange,
  onVerify,
  value
}: VerifyTokenFieldsProps) {
  const { t } = useLingui();

  return (
    <Stack gap="sm">
      <Text size="sm">
        <Trans>
          The token was enrolled, but you still need to verify it before you can use it!
        </Trans>
      </Text>
      <TextInput
        autoComplete="off"
        id="verifyResponse"
        label={message ?? t`Enter code to verify enrollment`}
        onChange={(event) => {
          onChange(event.currentTarget.value);
        }}
        value={value}
      />
      <Group justify="center">
        <Button disabled={value.trim() === ""} loading={isVerifying} onClick={onVerify}>
          <Trans>Verify Token</Trans>
        </Button>
      </Group>
    </Stack>
  );
}
