import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, getResolver } from "@/api/config";
import { getUserDetails, userQueryKeys, type UserDetail } from "@/api/users";
import {
  fallbackUserFields,
  getResolverUserFields,
  type UserFieldDefinition
} from "@/lib/userAttributes";

export interface UserDetailData {
  /** The attribute definitions of the user's resolver; empty until known. */
  fields: readonly UserFieldDefinition[];
  resolverName: string;
  userDetail: UserDetail | null;
  userQuery: UseQueryResult<UserDetail | null>;
}

/** Loads the user record and the attribute set of its resolver. */
export function useUserDetail(
  realm: string,
  username: string,
  enabled: boolean
): UserDetailData {
  const apiClient = useApiClient();

  const userQuery = useQuery({
    enabled,
    queryFn: async ({ signal }) => {
      const users = await getUserDetails(apiClient, { realm, username }, signal);

      return users[0] ?? null;
    },
    queryKey: userQueryKeys.detail(realm, username)
  });
  const userDetail = userQuery.data ?? null;
  const resolverName = userDetail?.resolver ?? "";

  // The attribute names come from the resolver configuration. Admins without
  // `resolverread` cannot fetch it; they get the common attribute set then.
  const resolverQuery = useQuery({
    enabled: enabled && resolverName.length > 0,
    queryFn: ({ signal }) => getResolver(apiClient, resolverName, signal),
    queryKey: configQueryKeys.resolver(resolverName),
    retry: false
  });
  const fields = useMemo<readonly UserFieldDefinition[]>(() => {
    if (!resolverQuery.isSuccess && !resolverQuery.isError) {
      return [];
    }

    const resolverFields = getResolverUserFields(resolverQuery.data?.[resolverName]);
    const knownFields = resolverFields.length > 0 ? resolverFields : fallbackUserFields;

    // An existing user keeps the stored password unless a new one is typed.
    return knownFields.map((field) =>
      field.type === "password" ? { ...field, required: false } : field
    );
  }, [
    resolverName,
    resolverQuery.data,
    resolverQuery.isError,
    resolverQuery.isSuccess
  ]);

  return { fields, resolverName, userDetail, userQuery };
}
