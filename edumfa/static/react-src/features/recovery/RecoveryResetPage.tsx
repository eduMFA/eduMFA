import { useLingui } from "@lingui/react/macro";
import {
  Alert,
  Anchor,
  Box,
  Button,
  Container,
  Paper,
  Text,
  Title
} from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";

import { useApiClient } from "@/api/ApiClientProvider";
import { resetRecoveredPassword } from "@/api/recovery";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { TextField } from "@/components/forms/TextField";
import { hashHref } from "@/lib/hashbang";

interface RecoveryResetFormValues {
  password: string;
  password2: string;
}

export function RecoveryResetPage() {
  const apiClient = useApiClient();
  const { t } = useLingui();
  const { recoverycode = "", user = "" } = useParams<{
    recoverycode: string;
    user: string;
  }>();
  const { formState, handleSubmit, register, reset } = useForm<RecoveryResetFormValues>(
    {
      mode: "onChange"
    }
  );
  const resetMutation = useMutation({
    mutationFn: (values: RecoveryResetFormValues) =>
      resetRecoveredPassword(apiClient, {
        password: values.password,
        recoverycode,
        user
      })
  });

  const submitForm = handleSubmit((values) => {
    resetMutation.mutate(values, {
      onSuccess: () => {
        reset();
      }
    });
  });

  return (
    <Box className="react-migration-shell">
      <Container size="xs">
        {resetMutation.isSuccess && resetMutation.data ? (
          <Alert color="green" mb="md" role="status" variant="light">
            {t`Your password has been reset successfully.`}{" "}
            <Anchor href={hashHref("/login")} size="sm">
              {t`Proceed to login`}
            </Anchor>
          </Alert>
        ) : null}
        {resetMutation.isSuccess && !resetMutation.data ? (
          <Alert color="red" mb="md" role="alert" variant="light">
            {t`Failed to reset your password.`}
          </Alert>
        ) : null}

        <ErrorAlert error={resetMutation.error} />

        <Paper p="xl" radius="md" withBorder>
          <form
            noValidate
            onSubmit={(event) => {
              void submitForm(event);
            }}
            role="form"
          >
            <Title mb="xs" order={2} size="h3">
              {t`Reset your Password`}
            </Title>
            <Text c="dimmed" mb="md" size="sm">
              {t`Please enter a new password.`}
            </Text>

            <TextField
              autoComplete="new-password"
              hasError={Boolean(formState.errors.password)}
              id="password"
              label={t`Password`}
              placeholder={t`Type a password`}
              registration={register("password", {
                deps: ["password2"],
                required: true
              })}
              type="password"
            />
            <TextField
              autoComplete="new-password"
              hasError={Boolean(formState.errors.password2)}
              id="password2"
              placeholder={t`Repeat password`}
              registration={register("password2", {
                required: true,
                validate: (value, values) => value === values.password
              })}
              type="password"
            />

            <Button
              disabled={!formState.isValid}
              fullWidth
              loading={resetMutation.isPending}
              mt="md"
              type="submit"
            >
              {t`Reset Password`}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
