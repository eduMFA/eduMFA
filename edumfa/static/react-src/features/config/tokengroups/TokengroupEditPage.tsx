import { Trans, useLingui } from "@lingui/react/macro";
import { Alert, Button, TextInput } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import { useApiClient } from "@/api/ApiClientProvider";
import type { Tokengroup } from "@/api/config";
import {
  getTokengroup,
  saveTokengroup,
  tokengroupQueryKeys,
  type TokengroupWriteRequest
} from "@/api/tokengroups";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SystemLayout } from "@/features/config/system/SystemLayout";
import { pushFlash } from "@/lib/flash";

/** `resourceNamePatterns.simple` of the legacy app. */
const RESOURCE_NAME_PATTERN = /^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$/;

interface TokengroupFormValues {
  description: string;
  groupname: string;
}

/**
 * Port of `config.tokengroup.edit.html`: creates a token group under
 * `/config/tokengroup/edit` and edits one under `/config/tokengroup/edit/:groupname`.
 */
export function TokengroupEditPage() {
  const { groupname } = useParams();
  const apiClient = useApiClient();
  const { isAuthenticated } = useAuth();
  const isEditing = groupname !== undefined;

  const groupQuery = useQuery({
    enabled: isAuthenticated && isEditing,
    queryFn: ({ signal }) => getTokengroup(apiClient, groupname ?? "", signal),
    queryKey: tokengroupQueryKeys.detail(groupname ?? "")
  });
  const group = isEditing ? groupQuery.data?.[groupname] : undefined;

  return (
    <SystemLayout activeItem="tokengroup">
      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={groupQuery.error} />

      {isEditing && groupQuery.isLoading ? (
        <LoadingIndicator label={<Trans>Loading tokengroup</Trans>} />
      ) : null}

      {isEditing && groupQuery.isSuccess && !group ? (
        <Alert color="yellow" mb="md" role="alert" variant="light">
          <Trans>The tokengroup {groupname} does not exist.</Trans>
        </Alert>
      ) : null}

      {isAuthenticated && (!isEditing || group) ? (
        <TokengroupForm
          existing={isEditing ? { group: group ?? {}, groupname } : null}
          key={groupname ?? ""}
        />
      ) : null}
    </SystemLayout>
  );
}

interface TokengroupFormProps {
  /** The loaded group when editing; `null` creates a new one. */
  existing: { group: Tokengroup; groupname: string } | null;
}

function TokengroupForm({ existing }: TokengroupFormProps) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLingui();
  const { rights } = useAuth();
  const canSave = hasRight(rights, "tokengroup_add");
  const { formState, handleSubmit, register, control } = useForm<TokengroupFormValues>({
    defaultValues: {
      description: existing?.group.description ?? "",
      groupname: existing?.groupname ?? ""
    },
    mode: "onChange"
  });
  const typedName = useWatch({ control, name: "groupname" });

  const saveMutation = useMutation({
    mutationFn: (values: TokengroupFormValues) => {
      const request: TokengroupWriteRequest = {
        description: values.description,
        groupname: values.groupname
      };

      if (existing?.group.id !== undefined) {
        request.id = existing.group.id;
      }

      return saveTokengroup(apiClient, request);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tokengroupQueryKeys.all });
      pushFlash(t`Tokengroup saved.`, "info");
      void navigate("/config/tokengroup/list");
    }
  });

  const submitForm = handleSubmit((values) => {
    saveMutation.mutate(values);
  });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        void submitForm(event);
      }}
    >
      <PageHeader
        title={
          existing ? (
            <Trans>Edit Tokengroup {existing.groupname}</Trans>
          ) : (
            <Trans>Create a new Tokengroup {typedName}</Trans>
          )
        }
      />

      <ErrorAlert error={saveMutation.error} />

      <Card
        footer={
          canSave ? (
            <Button
              disabled={!formState.isValid}
              leftSection={<IconDeviceFloppy size={16} />}
              loading={saveMutation.isPending}
              type="submit"
            >
              <Trans>Save Tokengroup</Trans>
            </Button>
          ) : null
        }
        footerAlign="center"
      >
        {existing ? null : (
          <TextInput
            autoFocus
            description={
              <Trans>
                This is the unique identifying name for this group definition.
              </Trans>
            }
            error={formState.errors.groupname?.message}
            id="identifier"
            label={<Trans>Identifier</Trans>}
            mb="md"
            placeholder="myNewGroup"
            required
            {...register("groupname", {
              pattern: {
                message: t`The resource name must consist of letters, numbers and '_', '-', '.'`,
                value: RESOURCE_NAME_PATTERN
              },
              required: true
            })}
          />
        )}

        <TextInput
          id="description"
          label={<Trans>Description</Trans>}
          placeholder={t`some wise words`}
          {...register("description")}
        />
      </Card>
    </form>
  );
}
