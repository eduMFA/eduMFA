import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { UserAttributeFields, type UserFormValues } from "./UserAttributeFields";
import { UserSidebar } from "./UserSidebar";
import { useApiClient } from "../../api/ApiClientProvider";
import { configQueryKeys, getResolvers } from "../../api/config";
import { createUser, userQueryKeys } from "../../api/users";
import { useAuth } from "../../auth/AuthProvider";
import { ErrorAlert } from "../../components/feedback/ErrorAlert";
import { LoadingIndicator } from "../../components/feedback/LoadingIndicator";
import { Card } from "../../components/layout/Card";
import { PageHeader } from "../../components/layout/PageHeader";
import { SidebarLayout } from "../../components/layout/SidebarLayout";
import { pushFlash } from "../../lib/flash";
import { hashHref } from "../../lib/hashbang";
import { getResolverUserFields } from "../../lib/userAttributes";

const editableResolverParams = { editable: true };

export function UserAddPage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLingui();
  const { isAuthenticated } = useAuth();
  const [selectedResolver, setSelectedResolver] = useState("");
  const { formState, handleSubmit, register, reset } = useForm<UserFormValues>({
    mode: "onChange"
  });

  const resolversQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getResolvers(apiClient, editableResolverParams, signal),
    queryKey: configQueryKeys.resolvers(editableResolverParams)
  });
  const resolverNames = Object.keys(resolversQuery.data ?? {});
  const activeResolver = selectedResolver || (resolverNames[0] ?? "");
  const fields = useMemo(
    () => getResolverUserFields(resolversQuery.data?.[activeResolver]),
    [activeResolver, resolversQuery.data]
  );

  const createMutation = useMutation({
    mutationFn: (values: UserFormValues) =>
      createUser(apiClient, activeResolver, {
        ...values,
        username: values.username ?? ""
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
      pushFlash(t`User created.`);
      void navigate("/user/list");
    }
  });

  const submitUser = handleSubmit((values) => {
    createMutation.mutate(values);
  });

  return (
    <SidebarLayout sidebar={<UserSidebar activeItem="add" />}>
      <PageHeader
        subtitle={<Trans>Create a user in an editable user store.</Trans>}
        title={<Trans>Add a new user</Trans>}
      />

      {!isAuthenticated ? (
        <div className="alert alert-warning" role="alert">
          <Trans>
            Log in through the legacy UI before opening this migrated route.
          </Trans>
        </div>
      ) : null}

      <ErrorAlert error={resolversQuery.error} />
      <ErrorAlert error={createMutation.error} />

      {resolversQuery.isLoading ? (
        <LoadingIndicator label={<Trans>Loading resolvers</Trans>} />
      ) : null}

      <form
        noValidate
        onSubmit={(event) => {
          void submitUser(event);
        }}
      >
        {resolverNames.length > 0 ? (
          <Card
            footer={
              <button
                className="btn btn-primary"
                disabled={!formState.isValid || createMutation.isPending}
                type="submit"
              >
                <span className="glyphicon glyphicon-save" aria-hidden="true" />
                <Trans>Save user</Trans>
              </button>
            }
            title={<Trans>User details</Trans>}
          >
            <div className="form-group">
              <label htmlFor="resolvername">
                <Trans>Resolver</Trans>
              </label>
              <select
                className="form-control"
                id="resolvername"
                onChange={(event) => {
                  setSelectedResolver(event.target.value);
                  reset({});
                }}
                required
                value={activeResolver}
              >
                {resolverNames.map((resolverName) => (
                  <option key={resolverName} value={resolverName}>
                    {resolverName}
                  </option>
                ))}
              </select>
              <span className="help-block">
                <Trans>
                  These are the resolvers marked as editable. You can add a user to the
                  resolver. The user will appear in the realms, that contain this
                  resolver.
                </Trans>
              </span>
            </div>

            <UserAttributeFields
              errors={formState.errors}
              fields={fields}
              isEditing
              register={register}
              values={{}}
            />
          </Card>
        ) : null}

        {resolversQuery.isSuccess && resolverNames.length === 0 ? (
          <Card>
            <p className="help-block">
              <Trans>
                You have no editable resolvers defined. So you can not write to any user
                store. If you want to add users, you need to{" "}
                <a href={hashHref("/config/resolvers/list")}>
                  define an editable resolver
                </a>{" "}
                (like SQLResolver) and check the box "Edit user store".
              </Trans>
            </p>
          </Card>
        ) : null}
      </form>
    </SidebarLayout>
  );
}
