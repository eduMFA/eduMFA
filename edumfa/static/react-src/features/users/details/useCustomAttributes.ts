import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult
} from "@tanstack/react-query";
import { useMemo } from "react";

import {
  useCustomAttributeDraft,
  type CustomAttributeDraft
} from "./useCustomAttributeDraft";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  deleteCustomAttribute,
  getCustomAttributes,
  getEditableAttributes,
  setCustomAttribute,
  userQueryKeys
} from "@/api/users";

export interface CustomAttributes {
  addMutation: UseMutationResult<number, Error, void>;
  canDeleteAttribute: (key: string) => boolean;
  deleteMutation: UseMutationResult<number, Error, string>;
  draft: CustomAttributeDraft;
  entries: [string, string][];
  /** Whether there is anything to show, set or delete at all. */
  isVisible: boolean;
  settableKeys: string[];
}

/**
 * Custom attributes: the policy response lists the keys that may be set
 * (with their allowed values) and deleted. "*" stands for free input.
 */
export function useCustomAttributes(
  realm: string,
  username: string,
  enabled: boolean
): CustomAttributes {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const attributeParams = useMemo(() => ({ realm, user: username }), [realm, username]);
  const editableAttributesQuery = useQuery({
    enabled,
    queryFn: ({ signal }) => getEditableAttributes(apiClient, attributeParams, signal),
    queryKey: userQueryKeys.editableAttributes(attributeParams)
  });
  const customAttributesQuery = useQuery({
    enabled,
    queryFn: ({ signal }) => getCustomAttributes(apiClient, username, realm, signal),
    queryKey: userQueryKeys.customAttributes(username, realm)
  });
  const settableAttributes = editableAttributesQuery.data?.set ?? {};
  const deletableAttributes = editableAttributesQuery.data?.delete ?? [];
  const settableKeys = Object.keys(settableAttributes);
  const entries = Object.entries(customAttributesQuery.data ?? {});
  const draft = useCustomAttributeDraft(settableAttributes);

  const invalidateAttributes = async () => {
    await queryClient.invalidateQueries({
      queryKey: userQueryKeys.customAttributes(username, realm)
    });
    await queryClient.invalidateQueries({
      queryKey: userQueryKeys.detail(realm, username)
    });
  };

  const addMutation = useMutation({
    mutationFn: () =>
      setCustomAttribute(
        apiClient,
        username,
        realm,
        draft.resolvedAttributeKey,
        draft.resolvedAttributeValue
      ),
    onSuccess: async () => {
      draft.selectAttributeKey(draft.selectedAttributeKey);
      await invalidateAttributes();
    }
  });
  const deleteMutation = useMutation({
    mutationFn: (key: string) => deleteCustomAttribute(apiClient, username, realm, key),
    onSuccess: invalidateAttributes
  });

  return {
    addMutation,
    canDeleteAttribute: (key) =>
      deletableAttributes.includes(key) || deletableAttributes.includes("*"),
    deleteMutation,
    draft,
    entries,
    isVisible:
      settableKeys.length > 0 || deletableAttributes.length > 0 || entries.length > 0,
    settableKeys
  };
}
