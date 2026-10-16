import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";

import { UserSidebar } from "./UserSidebar";
import { useApiClient } from "../../api/ApiClientProvider";
import { getUserDetails, updateUser, userQueryKeys } from "../../api/users";
import { useAuth } from "../../auth/AuthProvider";
import { hasRight } from "../../auth/permissions";
import { ErrorAlert } from "../../components/feedback/ErrorAlert";
import { InfoAlert } from "../../components/feedback/InfoAlert";
import { LoadingIndicator } from "../../components/feedback/LoadingIndicator";
import { Card } from "../../components/layout/Card";
import { PageHeader } from "../../components/layout/PageHeader";
import { SidebarLayout } from "../../components/layout/SidebarLayout";
import type { FlashMessage } from "../../lib/flash";

interface PasswordFormValues {
  password: string;
  passwordRepeat: string;
}

/**
 * Port of `user.password.html`: a user's own details plus the password form
 * shown when the user store is editable. `GET /user/` without parameters
 * resolves to the authenticated user on the backend.
 */
export function UserPasswordPage() {
  const apiClient = useApiClient();
  const { t } = useLingui();
  const { isAuthenticated, rights, user } = useAuth();
  const [flash, setFlash] = useState<FlashMessage | null>(null);
  const { formState, handleSubmit, register, reset } = useForm<PasswordFormValues>({
    defaultValues: { password: "", passwordRepeat: "" },
    mode: "onChange"
  });

  const userQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: async ({ signal }) => {
      const users = await getUserDetails(apiClient, {}, signal);

      return users[0] ?? null;
    },
    queryKey: userQueryKeys.self
  });
  const userDetail = userQuery.data ?? null;

  const passwordMutation = useMutation({
    mutationFn: (values: PasswordFormValues) =>
      updateUser(apiClient, userDetail?.resolver ?? "", {
        password: values.password,
        username: userDetail?.username ?? ""
      }),
    onSuccess: () => {
      setFlash({ message: t`Password set successfully.`, type: "info" });
      reset();
    }
  });

  const submitPassword = handleSubmit((values) => {
    passwordMutation.mutate(values);
  });

  const canSetPassword =
    Boolean(userDetail?.editable) && hasRight(rights, "updateuser");

  return (
    <SidebarLayout sidebar={<UserSidebar activeItem="password" />}>
      <PageHeader
        subtitle={user?.realm ? <Trans>Realm {user.realm}</Trans> : null}
        title={<Trans>Your details</Trans>}
      />

      {!isAuthenticated ? (
        <div className="alert alert-warning" role="alert">
          <Trans>
            Log in through the legacy UI before opening this migrated route.
          </Trans>
        </div>
      ) : null}

      <InfoAlert
        message={flash?.message ?? null}
        onDismiss={() => {
          setFlash(null);
        }}
        type={flash?.type}
      />
      <ErrorAlert error={userQuery.error} />
      <ErrorAlert error={passwordMutation.error} />

      {userQuery.isLoading ? (
        <LoadingIndicator label={<Trans>Loading user</Trans>} />
      ) : null}

      {userDetail ? (
        <Card title={<Trans>Profile</Trans>}>
          <div className="row">
            <div className="col-sm-6">
              <DetailField label={<Trans>Username</Trans>} name="username">
                {userDetail.username}
              </DetailField>
              <DetailField label={<Trans>Given name</Trans>} name="givenname">
                {userDetail.givenname}
              </DetailField>
              <DetailField label={<Trans>Surname</Trans>} name="surname">
                {userDetail.surname}
              </DetailField>
              <DetailField label={<Trans>Description</Trans>} name="description">
                {userDetail.description}
              </DetailField>
            </div>
            <div className="col-sm-6">
              <DetailField label={<Trans>Email</Trans>} name="email">
                {userDetail.email ? (
                  <a href={`mailto:${userDetail.email}`}>{userDetail.email}</a>
                ) : null}
              </DetailField>
              <DetailField label={<Trans>Phone</Trans>} name="phone">
                {userDetail.phone}
              </DetailField>
              <DetailField label={<Trans>Mobile</Trans>} name="mobile">
                {userDetail.mobile}
              </DetailField>
            </div>
          </div>
        </Card>
      ) : null}

      {userDetail && canSetPassword ? (
        <form
          noValidate
          onSubmit={(event) => {
            void submitPassword(event);
          }}
        >
          <Card
            footer={
              <button
                className="btn btn-primary"
                disabled={!formState.isValid || passwordMutation.isPending}
                type="submit"
              >
                <span className="glyphicon glyphicon-lock" aria-hidden="true" />
                <Trans>set password</Trans>
              </button>
            }
            title={<Trans>Change password</Trans>}
          >
            <div
              className={
                formState.errors.passwordRepeat ? "form-group has-error" : "form-group"
              }
            >
              <label htmlFor="password">
                <Trans>Password</Trans>
              </label>
              <input
                autoComplete="new-password"
                className="form-control"
                id="password"
                placeholder={t`Type a password`}
                type="password"
                {...register("password", {
                  deps: ["passwordRepeat"],
                  required: true
                })}
              />
              <input
                aria-label={t`Repeat password`}
                autoComplete="new-password"
                className="form-control"
                id="passwordRepeat"
                placeholder={t`Repeat password`}
                type="password"
                {...register("passwordRepeat", {
                  required: true,
                  validate: (value, values) => value === values.password
                })}
              />
              {formState.errors.passwordRepeat ? (
                <span className="help-block">
                  <Trans>The passwords do not match.</Trans>
                </span>
              ) : null}
            </div>
          </Card>
        </form>
      ) : null}
    </SidebarLayout>
  );
}

interface DetailFieldProps {
  children?: ReactNode;
  label: ReactNode;
  name: string;
}

function DetailField({ children, label, name }: DetailFieldProps) {
  return (
    <div className="react-field">
      <span className="react-field__label">{label}</span>
      <div className="react-field__value" data-field={name}>
        {children}
      </div>
    </div>
  );
}
