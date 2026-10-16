import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor, Button, PasswordInput, SimpleGrid } from "@mantine/core";
import { IconLock } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { UserSidebar } from "./UserSidebar";
import { useApiClient } from "../../api/ApiClientProvider";
import { getUserDetails, updateUser, userQueryKeys } from "../../api/users";
import { useAuth } from "../../auth/AuthProvider";
import { hasRight } from "../../auth/permissions";
import { ErrorAlert } from "../../components/feedback/ErrorAlert";
import { LoadingIndicator } from "../../components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "../../components/feedback/LoginRequiredAlert";
import { FieldValue } from "../../components/forms/FieldValue";
import { Card } from "../../components/layout/Card";
import { PageHeader } from "../../components/layout/PageHeader";
import { SidebarLayout } from "../../components/layout/SidebarLayout";
import { notify } from "../../lib/notify";

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
      notify(t`Password set successfully.`, "success");
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

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={userQuery.error} />
      <ErrorAlert error={passwordMutation.error} />

      {userQuery.isLoading ? (
        <LoadingIndicator label={<Trans>Loading user</Trans>} />
      ) : null}

      {userDetail ? (
        <Card title={<Trans>Profile</Trans>}>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" verticalSpacing={0}>
            <FieldValue label={<Trans>Username</Trans>} name="username">
              {userDetail.username}
            </FieldValue>
            <FieldValue label={<Trans>Email</Trans>} name="email">
              {userDetail.email ? (
                <Anchor href={`mailto:${userDetail.email}`} size="sm">
                  {userDetail.email}
                </Anchor>
              ) : null}
            </FieldValue>
            <FieldValue label={<Trans>Given name</Trans>} name="givenname">
              {userDetail.givenname}
            </FieldValue>
            <FieldValue label={<Trans>Phone</Trans>} name="phone">
              {userDetail.phone}
            </FieldValue>
            <FieldValue label={<Trans>Surname</Trans>} name="surname">
              {userDetail.surname}
            </FieldValue>
            <FieldValue label={<Trans>Mobile</Trans>} name="mobile">
              {userDetail.mobile}
            </FieldValue>
            <FieldValue label={<Trans>Description</Trans>} name="description">
              {userDetail.description}
            </FieldValue>
          </SimpleGrid>
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
              <Button
                disabled={!formState.isValid}
                leftSection={<IconLock size={16} />}
                loading={passwordMutation.isPending}
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
                formState.errors.passwordRepeat
                  ? t`The passwords do not match.`
                  : undefined
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
      ) : null}
    </SidebarLayout>
  );
}
