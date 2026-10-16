import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";

import { useApiClient } from "../../api/ApiClientProvider";
import { resetRecoveredPassword } from "../../api/recovery";
import { ErrorAlert } from "../../components/feedback/ErrorAlert";
import { TextField } from "../../components/forms/TextField";
import { hashHref } from "../../lib/hashbang";

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
    { mode: "onChange" }
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
    <div className="react-migration-shell">
      <div className="well">
        {resetMutation.isSuccess ? (
          resetMutation.data ? (
            <div className="alert alert-success" role="alert">
              <Trans>Your password has been reset successfully.</Trans>{" "}
              <a href={hashHref("/login")}>
                <Trans>Proceed to login</Trans>
              </a>
            </div>
          ) : (
            <div className="alert alert-danger" role="alert">
              <Trans>Failed to reset your password.</Trans>
            </div>
          )
        ) : null}

        <ErrorAlert error={resetMutation.error} />

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
              <Trans>Reset your Password</Trans>
            </h2>
            <p className="help-block">
              <Trans>Please enter a new password.</Trans>
            </p>

            <TextField
              autoComplete="new-password"
              hasError={Boolean(formState.errors.password)}
              id="password"
              label={<Trans>Password</Trans>}
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

            <div className="text-center">
              <button
                className="btn btn-primary btn-block"
                disabled={!formState.isValid || resetMutation.isPending}
                type="submit"
              >
                <Trans>Reset Password</Trans>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
