import { Trans, useLingui } from "@lingui/react/macro";
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
    <div className="react-migration-shell">
      <div className="well">
        <div className="alert alert-info" role="alert">
          <Trans>Here you may register a new user account</Trans>
        </div>

        {registerMutation.isSuccess ? (
          <div className="alert alert-info" role="alert">
            <Trans>User account created. An Email has been sent to you.</Trans>
          </div>
        ) : null}

        <ErrorAlert error={registerMutation.error} />

        <div className="container">
          <form
            className="form-signin"
            noValidate
            onSubmit={(event) => {
              void submitForm(event);
            }}
            role="form"
          >
            <h2 className="form-signin-heading">
              <Trans>Register</Trans>
            </h2>

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

            <div className="text-center">
              <button
                className="btn btn-primary btn-block"
                disabled={!formState.isValid || registerMutation.isPending}
                type="submit"
              >
                <Trans>Register</Trans>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
