import { Trans, useLingui } from "@lingui/react/macro";
import { Alert, Box, Button, Container, Paper, Title } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { useApiClient } from "../../api/ApiClientProvider";
import { registerUser } from "../../api/register";
import { ErrorAlert } from "../../components/feedback/ErrorAlert";
import { TextField } from "../../components/forms/TextField";

interface RegisterFormValues {
  email: string;
  givenname: string;
  mobile: string;
  password: string;
  password2: string;
  phone: string;
  surname: string;
  username: string;
}

export function RegisterPage() {
  const apiClient = useApiClient();
  const { t } = useLingui();
  const { formState, handleSubmit, register, reset } = useForm<RegisterFormValues>({
    mode: "onChange"
  });
  const registerMutation = useMutation({
    mutationFn: (values: RegisterFormValues) =>
      registerUser(apiClient, {
        email: values.email,
        givenname: values.givenname,
        mobile: values.mobile,
        password: values.password,
        phone: values.phone,
        surname: values.surname,
        username: values.username
      })
  });

  const submitForm = handleSubmit((values) => {
    registerMutation.mutate(values, {
      onSuccess: () => {
        reset();
      }
    });
  });

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

            <TextField
              autoFocus
              hasError={Boolean(formState.errors.username)}
              id="username"
              label={<Trans>Username</Trans>}
              placeholder={t`Username`}
              registration={register("username", { required: true })}
            />
            <TextField
              hasError={Boolean(formState.errors.surname)}
              id="surname"
              label={<Trans>Surname</Trans>}
              placeholder={t`Surname`}
              registration={register("surname", { required: true })}
            />
            <TextField
              hasError={Boolean(formState.errors.givenname)}
              id="givenname"
              label={<Trans>Given name</Trans>}
              placeholder={t`Given name`}
              registration={register("givenname", { required: true })}
            />
            <TextField
              hasError={Boolean(formState.errors.email)}
              id="email"
              label={<Trans>Email</Trans>}
              placeholder={t`Email`}
              registration={register("email", { required: true })}
              type="email"
            />
            <TextField
              id="mobile"
              label={<Trans>Mobile</Trans>}
              placeholder={t`Mobile`}
              registration={register("mobile")}
            />
            <TextField
              id="phone"
              label={<Trans>Phone</Trans>}
              placeholder={t`Phone`}
              registration={register("phone")}
            />
            <TextField
              autoComplete="new-password"
              hasError={Boolean(formState.errors.password)}
              id="password"
              label={<Trans>Password</Trans>}
              placeholder={t`Password`}
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
              placeholder={t`Password`}
              registration={register("password2", {
                required: true,
                validate: (value, values) => value === values.password
              })}
              type="password"
            />

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
