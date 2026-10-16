import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { useApiClient } from "../../api/ApiClientProvider";
import { requestRecoveryCode } from "../../api/recovery";
import { ErrorAlert } from "../../components/feedback/ErrorAlert";
import { TextField } from "../../components/forms/TextField";

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
    <div className="react-migration-shell">
      <div className="well">
        <div className="alert alert-info" role="alert">
          <Trans>If you forgot your password, you may set a new one.</Trans>
        </div>

        {recoveryMutation.isSuccess ? (
          <div className="alert alert-info" role="alert">
            <Trans>An Email to reset the password has been sent to you.</Trans>
          </div>
        ) : null}

        <ErrorAlert error={recoveryMutation.error} />

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
              <Trans>Reset Password</Trans>
            </h2>

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

            <div className="text-center">
              <button
                className="btn btn-primary btn-block"
                disabled={!formState.isValid || recoveryMutation.isPending}
                type="submit"
              >
                <Trans>Send Reset Code</Trans>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
