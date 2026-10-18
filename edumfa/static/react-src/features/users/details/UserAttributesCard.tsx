import { Trans } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";

import { UserActionButtons } from "./UserActionButtons";
import type { UserEditor } from "./useUserEditor";
import type { UserDetail } from "@/api/users";
import { Card } from "@/components/layout/Card";
import { UserAttributeFields } from "@/features/users/UserAttributeFields";
import type { UserFieldDefinition } from "@/lib/userAttributes";

export interface UserAttributesCardProps {
  canDelete: boolean;
  canUpdate: boolean;
  editor: UserEditor;
  fields: readonly UserFieldDefinition[];
  onDelete: () => void;
  userDetail: UserDetail;
}

/** The resolver attributes of the user, read-only or as the edit form. */
export function UserAttributesCard({
  canDelete,
  canUpdate,
  editor,
  fields,
  onDelete,
  userDetail
}: UserAttributesCardProps) {
  const { cancelEditing, form, isEditing, startEditing, submitUser, updateMutation } =
    editor;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        void submitUser(event);
      }}
    >
      <Card
        actions={
          userDetail.editable && !isEditing ? (
            <UserActionButtons
              canDelete={canDelete}
              canUpdate={canUpdate}
              onDelete={onDelete}
              onEdit={startEditing}
            />
          ) : null
        }
        footer={
          isEditing ? (
            <>
              <Button
                disabled={!form.formState.isValid}
                leftSection={<IconDeviceFloppy size={16} />}
                loading={updateMutation.isPending}
                type="submit"
              >
                <Trans>Save user</Trans>
              </Button>
              <Button onClick={cancelEditing} variant="default">
                <Trans>Cancel</Trans>
              </Button>
            </>
          ) : undefined
        }
        title={<Trans>User details</Trans>}
      >
        <UserAttributeFields
          errors={form.formState.errors}
          fields={fields}
          isEditing={isEditing}
          register={form.register}
          values={userDetail}
        />
      </Card>
    </form>
  );
}
