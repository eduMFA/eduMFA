import { useLingui } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";

import { NoEditableResolverCard } from "./NoEditableResolverCard";
import { ResolverSelect } from "./ResolverSelect";
import { UserAttributeFields } from "./UserAttributeFields";
import { UserSidebar } from "./UserSidebar";
import { useCreateUser } from "./useCreateUser";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

export function UserAddPage() {
  const { t } = useLingui();

  const { isAuthenticated } = useAuth();
  const {
    activeResolver,
    createMutation,
    fields,
    formState,
    register,
    resolverNames,
    resolversQuery,
    selectResolver,
    submitUser
  } = useCreateUser();

  return (
    <SidebarLayout sidebar={<UserSidebar activeItem="add" />}>
      <PageHeader
        subtitle={t`Create a user in an editable user store.`}
        title={t`Add a new user`}
      />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={resolversQuery.error} />
      <ErrorAlert error={createMutation.error} />

      {resolversQuery.isLoading ? (
        <LoadingIndicator label={t`Loading resolvers`} />
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
                {t`Save user`}
              </Button>
            }
            title={t`User details`}
          >
            <ResolverSelect
              onChange={selectResolver}
              resolverNames={resolverNames}
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
          <NoEditableResolverCard />
        ) : null}
      </form>
    </SidebarLayout>
  );
}
