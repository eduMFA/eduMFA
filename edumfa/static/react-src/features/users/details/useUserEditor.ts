import { useLingui } from "@lingui/react/macro";
import {
  useMutation,
  useQueryClient,
  type UseMutationResult
} from "@tanstack/react-query";
import { useState, type BaseSyntheticEvent } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  updateUser,
  userQueryKeys,
  type UserDetail,
  type UserWriteRequest
} from "@/api/users";
import {
  formatFieldValue,
  type UserFormValues
} from "@/features/users/UserAttributeFields";
import { notify } from "@/lib/notify";
import type { UserFieldDefinition } from "@/lib/userAttributes";

export interface UserEditorParams {
  fields: readonly UserFieldDefinition[];
  realm: string;
  resolverName: string;
  userDetail: UserDetail | null;
  username: string;
}

export interface UserEditor {
  cancelEditing: () => void;
  form: UseFormReturn<UserFormValues>;
  isEditing: boolean;
  startEditing: () => void;
  submitUser: (event?: BaseSyntheticEvent) => Promise<void>;
  updateMutation: UseMutationResult<boolean, Error, UserFormValues>;
}

/** The edit mode of the user attributes and the `PUT /user/` behind it. */
export function useUserEditor({
  fields,
  realm,
  resolverName,
  userDetail,
  username
}: UserEditorParams): UserEditor {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLingui();
  const [isEditing, setIsEditing] = useState(false);
  const form = useForm<UserFormValues>({ mode: "onChange" });

  const updateMutation = useMutation({
    mutationFn: (values: UserFormValues) => {
      const request: UserWriteRequest = {
        ...values,
        username: values.username ?? username
      };

      if (userDetail) {
        request.userid = userDetail.userid;
      }

      return updateUser(apiClient, resolverName, request);
    },
    onSuccess: async (updated, values) => {
      if (!updated) {
        notify(t`Failed to update user.`, "danger");

        return;
      }

      setIsEditing(false);
      notify(t`User updated successfully.`, "success");
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.all });

      const nextUsername = values.username ?? username;

      if (nextUsername !== username) {
        void navigate(
          `/user/details/${encodeURIComponent(realm)}/${encodeURIComponent(nextUsername)}`
        );
      }
    }
  });

  const startEditing = () => {
    if (!userDetail) {
      return;
    }

    form.reset(createFormValues(fields, userDetail));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    form.reset({});
  };

  const submitUser = form.handleSubmit((values) => {
    updateMutation.mutate(values);
  });

  return { cancelEditing, form, isEditing, startEditing, submitUser, updateMutation };
}

function createFormValues(
  fields: readonly UserFieldDefinition[],
  user: UserDetail
): UserFormValues {
  const values: UserFormValues = {};

  for (const field of fields) {
    values[field.name] =
      field.type === "password" ? "" : formatFieldValue(user[field.name]);
  }

  return values;
}
