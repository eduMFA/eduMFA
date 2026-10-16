import type { ApiClient } from "./client";

/**
 * Typed port of the AngularJS `UserFactory`. The legacy factory cancelled
 * concurrent `getUsers` calls through a `$q` canceller; React callers get the
 * same behavior by passing the React Query `signal`.
 */

export interface UserListParams {
  description?: string;
  email?: string;
  givenname?: string;
  realm?: string;
  resolver?: string;
  surname?: string;
  userid?: string;
  username?: string;
}

export interface UserDetail {
  description?: string;
  editable?: boolean;
  email?: string;
  givenname?: string;
  mobile?: string;
  phone?: string;
  resolver: string;
  surname?: string;
  userid: string;
  username: string;
  [key: string]: unknown;
}

export interface UserWriteRequest {
  description?: string;
  email?: string;
  givenname?: string;
  mobile?: string;
  password?: string;
  phone?: string;
  surname?: string;
  /** Lets the backend address the user by id, so the username itself can be changed. */
  userid?: string;
  username: string;
  [key: string]: unknown;
}

/**
 * Custom attributes the current session may set or delete, as returned by
 * `GET /user/editable_attributes/`. "*" in either list means "any key"; a
 * "*" value means free text.
 */
export interface EditableAttributes {
  delete?: string[];
  set?: Record<string, string[]>;
}

export const userQueryKeys = {
  all: ["users"] as const,
  customAttributes: (username: string, realm: string) =>
    ["users", "attributes", realm, username] as const,
  detail: (realm: string, username: string) =>
    ["users", "detail", realm, username] as const,
  editableAttributes: (params?: Record<string, unknown>) =>
    ["users", "editable-attributes", params ?? {}] as const,
  list: (params?: UserListParams) => ["users", "list", params ?? {}] as const,
  /** The authenticated user's own record (`GET /user/` without parameters). */
  self: ["users", "self"] as const
};

export function getUsers(
  apiClient: ApiClient,
  params?: UserListParams,
  signal?: AbortSignal
): Promise<UserDetail[]> {
  return apiClient.get<UserDetail[]>("/user/", { params: { ...params }, signal });
}

export function getUserDetails(
  apiClient: ApiClient,
  params: UserListParams,
  signal?: AbortSignal
): Promise<UserDetail[]> {
  return apiClient.get<UserDetail[]>("/user/", { params: { ...params }, signal });
}

export function createUser(
  apiClient: ApiClient,
  resolver: string,
  user: UserWriteRequest
): Promise<number> {
  return apiClient.post<number>("/user/", {
    ...user,
    resolver,
    user: user.username
  });
}

export function updateUser(
  apiClient: ApiClient,
  resolver: string,
  user: UserWriteRequest
): Promise<boolean> {
  return apiClient.put<boolean>("/user/", {
    ...user,
    resolver,
    user: user.username
  });
}

export function deleteUser(
  apiClient: ApiClient,
  resolver: string,
  username: string
): Promise<boolean> {
  return apiClient.delete<boolean>(
    `/user/${encodeURIComponent(resolver)}/${encodeURIComponent(username)}`
  );
}

export function getEditableAttributes(
  apiClient: ApiClient,
  params?: { realm?: string; resolver?: string; user?: string },
  signal?: AbortSignal
): Promise<EditableAttributes> {
  return apiClient.get<EditableAttributes>("/user/editable_attributes/", {
    params: { ...params },
    signal
  });
}

export function getCustomAttributes(
  apiClient: ApiClient,
  username: string,
  realm: string,
  signal?: AbortSignal
): Promise<Record<string, string>> {
  return apiClient.get<Record<string, string>>("/user/attribute", {
    params: { realm, user: username },
    signal
  });
}

export function setCustomAttribute(
  apiClient: ApiClient,
  username: string,
  realm: string,
  key: string,
  value: string
): Promise<number> {
  return apiClient.post<number>("/user/attribute", {
    key,
    realm,
    user: username,
    value
  });
}

export function deleteCustomAttribute(
  apiClient: ApiClient,
  username: string,
  realm: string,
  key: string
): Promise<number> {
  return apiClient.delete<number>(
    `/user/attribute/${encodeURIComponent(key)}/${encodeURIComponent(username)}/${encodeURIComponent(realm)}`
  );
}
