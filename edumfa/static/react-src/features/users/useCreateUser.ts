import { useLingui } from "@lingui/react/macro";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult
} from "@tanstack/react-query";
import { useMemo, useState, type BaseSyntheticEvent } from "react";
import { useForm, type FormState, type UseFormRegister } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import type { UserFormValues } from "./UserAttributeFields";
import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, getResolvers, type ResolversResponse } from "@/api/config";
import { createUser, userQueryKeys } from "@/api/users";
import { useAuth } from "@/auth/AuthProvider";
import { pushFlash } from "@/lib/flash";
import { getResolverUserFields, type UserFieldDefinition } from "@/lib/userAttributes";

const editableResolverParams = { editable: true };

export interface CreateUser {
  activeResolver: string;
  createMutation: UseMutationResult<number, Error, UserFormValues>;
  fields: readonly UserFieldDefinition[];
  formState: FormState<UserFormValues>;
  register: UseFormRegister<UserFormValues>;
  resolverNames: string[];
  resolversQuery: UseQueryResult<ResolversResponse>;
  /** Switches the target resolver and clears the typed attributes. */
  selectResolver: (resolverName: string) => void;
  submitUser: (event?: BaseSyntheticEvent) => Promise<void>;
}

/** The editable resolvers, the attribute form for the chosen one and `POST /user/`. */
export function useCreateUser(): CreateUser {
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

  return {
    activeResolver,
    createMutation,
    fields,
    formState,
    register,
    resolverNames,
    resolversQuery,
    selectResolver: (resolverName) => {
      setSelectedResolver(resolverName);
      reset({});
    },
    submitUser
  };
}
