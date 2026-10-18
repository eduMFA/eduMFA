import { Trans, useLingui } from "@lingui/react/macro";
import { Button, PasswordInput } from "@mantine/core";
import { IconLock } from "@tabler/icons-react";

import type { ChangePassword } from "./useChangePassword";
import { Card } from "@/components/layout/Card";

export interface ChangePasswordFormProps {
  changePassword: ChangePassword;
}

/** Password and repeat inputs; the submit stays disabled until both match. */
export function ChangePasswordForm({ changePassword }: ChangePasswordFormProps) {
  const { t } = useLingui();
  const { formState, mutation, register, submitPassword } = changePassword;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        void submitPassword(event);
      }}
    >
      <Card
        footer={
          <Button
            disabled={!formState.isValid}
            leftSection={<IconLock size={16} />}
            loading={mutation.isPending}
            type="submit"
          >
            <Trans>set password</Trans>
          </Button>
        }
        title={<Trans>Change password</Trans>}
      >
        <PasswordInput
          autoComplete="new-password"
          id="password"
          label={<Trans>Password</Trans>}
          mb="sm"
          placeholder={t`Type a password`}
          {...register("password", {
            deps: ["passwordRepeat"],
            required: true
          })}
        />
        <PasswordInput
          aria-label={t`Repeat password`}
          autoComplete="new-password"
          error={
            formState.errors.passwordRepeat ? t`The passwords do not match.` : undefined
          }
          id="passwordRepeat"
          placeholder={t`Repeat password`}
          {...register("passwordRepeat", {
            required: true,
            validate: (value, values) => value === values.password
          })}
        />
      </Card>
    </form>
  );
}
