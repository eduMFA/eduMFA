import { Trans } from "@lingui/react/macro";
import { Alert, Box, Button, Container, Paper, Title } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

import { RegisterFormFields } from "./RegisterFormFields";
import { useRegisterForm } from "./useRegisterForm";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";

export function RegisterPage() {
  const { formState, register, registerMutation, submitForm } = useRegisterForm();

  return (
    <Box className="react-migration-shell">
      <Container size="xs">
        <Alert icon={<IconInfoCircle size={18} />} mb="md" variant="light">
          <Trans>Here you may register a new user account</Trans>
        </Alert>

        {registerMutation.isSuccess ? (
          <Alert color="green" mb="md" role="status" variant="light">
            <Trans>User account created. An Email has been sent to you.</Trans>
          </Alert>
        ) : null}

        <ErrorAlert error={registerMutation.error} />

        <Paper p="xl" radius="md" withBorder>
          <form
            noValidate
            onSubmit={(event) => {
              void submitForm(event);
            }}
            role="form"
          >
            <Title mb="md" order={2} size="h3">
              <Trans>Register</Trans>
            </Title>

            <RegisterFormFields errors={formState.errors} register={register} />

            <Button
              disabled={!formState.isValid}
              fullWidth
              loading={registerMutation.isPending}
              mt="md"
              type="submit"
            >
              <Trans>Register</Trans>
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
