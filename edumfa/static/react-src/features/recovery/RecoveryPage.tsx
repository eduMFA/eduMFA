import { Trans, useLingui } from "@lingui/react/macro";
import { Alert, Box, Button, Container, Paper, Title } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { useApiClient } from "@/api/ApiClientProvider";
import { requestRecoveryCode } from "@/api/recovery";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { TextField } from "@/components/forms/TextField";

interface RecoveryFormValues {
  email: string;
  user: string;
}

export function RecoveryPage() {
  const apiClient = useApiClient();
  const { t } = useLingui();
  const { formState, handleSubmit, register, reset } = useForm<RecoveryFormValues>({
    mode: "onChange"
  });
  const recoveryMutation = useMutation({
    mutationFn: (values: RecoveryFormValues) => requestRecoveryCode(apiClient, values)
  });

  const submitForm = handleSubmit((values) => {
    recoveryMutation.mutate(values, {
      onSuccess: () => {
        reset();
      }
    });
  });

  return (
    <Box className="react-migration-shell">
      <Container size="xs">
        <Alert icon={<IconInfoCircle size={18} />} mb="md" variant="light">
          <Trans>If you forgot your password, you may set a new one.</Trans>
        </Alert>

        {recoveryMutation.isSuccess ? (
          <Alert color="green" mb="md" role="status" variant="light">
            <Trans>An Email to reset the password has been sent to you.</Trans>
          </Alert>
        ) : null}

        <ErrorAlert error={recoveryMutation.error} />

        <Paper p="xl" radius="md" withBorder>
          <form
            noValidate
            onSubmit={(event) => {
              void submitForm(event);
            }}
            role="form"
          >
            <Title mb="md" order={2} size="h3">
              <Trans>Reset Password</Trans>
            </Title>

            <TextField
              autoFocus
              hasError={Boolean(formState.errors.user)}
              id="username"
              label={<Trans>Username</Trans>}
              placeholder={t`Username`}
              registration={register("user", { required: true })}
            />
            <TextField
              hasError={Boolean(formState.errors.email)}
              id="email"
              label={<Trans>Email</Trans>}
              placeholder={t`Email`}
              registration={register("email", { required: true })}
              type="email"
            />

            <Button
              disabled={!formState.isValid}
              fullWidth
              loading={recoveryMutation.isPending}
              mt="md"
              type="submit"
            >
              <Trans>Send Reset Code</Trans>
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
