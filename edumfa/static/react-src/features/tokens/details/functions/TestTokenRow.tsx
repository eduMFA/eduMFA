import { useLingui } from "@lingui/react/macro";
import { Button, Checkbox, Group, SimpleGrid } from "@mantine/core";
import { IconQuestionMark } from "@tabler/icons-react";
import { useState } from "react";

import { TestPasswordInput } from "./TestPasswordInput";
import type { TestTokenForm } from "./useTestTokenForm";

export interface TestTokenRowProps {
  /** Registration tokens cannot be tested; the input is left out. */
  canTest: boolean;
  form: TestTokenForm;
}

/** The test authentication: show-password toggle, password and the two test buttons. */
export function TestTokenRow({ canTest, form }: TestTokenRowProps) {
  const { t } = useLingui();
  const [showPassword, setShowPassword] = useState(false);
  const { mutation, password, placeholder, setPassword } = form;

  return (
    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm">
      <Checkbox
        checked={showPassword}
        id="showPassword"
        label={t`Show password`}
        onChange={(event) => {
          setShowPassword(event.currentTarget.checked);
        }}
      />
      {canTest ? (
        <TestPasswordInput
          onChange={setPassword}
          placeholder={placeholder}
          showPassword={showPassword}
          value={password}
        />
      ) : (
        <span />
      )}
      <Group gap="xs">
        <Button
          disabled={password.length === 0}
          id="testOtpButton"
          leftSection={<IconQuestionMark size={16} />}
          loading={mutation.isPending}
          onClick={() => {
            mutation.mutate(false);
          }}
          title={t`Check with OTP PIN.`}
        >
          {t`Test token`}
        </Button>
        <Button
          disabled={password.length === 0}
          id="testOtpOnlyButton"
          leftSection={<IconQuestionMark size={16} />}
          loading={mutation.isPending}
          onClick={() => {
            mutation.mutate(true);
          }}
          title={t`Check OTP only.`}
          variant="default"
        >
          {t`Test OTP only`}
        </Button>
      </Group>
    </SimpleGrid>
  );
}
