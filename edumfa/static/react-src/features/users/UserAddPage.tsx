import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor, Button, NativeSelect, Text } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { UserAttributeFields, type UserFormValues } from "./UserAttributeFields";
import { UserSidebar } from "./UserSidebar";
import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, getResolvers } from "@/api/config";
import { createUser, userQueryKeys } from "@/api/users";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { pushFlash } from "@/lib/flash";
import { hashHref } from "@/lib/hashbang";
import { getResolverUserFields } from "@/lib/userAttributes";

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
      pushFlash(t`User created.`, "success");
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

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
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
              <Button
                disabled={!formState.isValid}
                leftSection={<IconDeviceFloppy size={16} />}
                loading={createMutation.isPending}
                type="submit"
              >
                <Trans>Save user</Trans>
              </Button>
            }
            title={<Trans>User details</Trans>}
          >
            <NativeSelect
              data={resolverNames}
              description={
                <Trans>
                  These are the resolvers marked as editable. You can add a user to the
                  resolver. The user will appear in the realms, that contain this
                  resolver.
                </Trans>
              }
              id="resolvername"
              label={<Trans>Resolver</Trans>}
              mb="md"
              onChange={(event) => {
                setSelectedResolver(event.currentTarget.value);
                reset({});
              }}
              required
              value={activeResolver}
            />

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
            <Text size="sm">
              <Trans>
                You have no editable resolvers defined. So you can not write to any user
                store. If you want to add users, you need to{" "}
                <Anchor href={hashHref("/config/resolvers/list")} size="sm">
                  define an editable resolver
                </Anchor>{" "}
                (like SQLResolver) and check the box "Edit user store".
              </Trans>
            </Text>
          </Card>
        ) : null}
      </form>
    </SidebarLayout>
  );
}
