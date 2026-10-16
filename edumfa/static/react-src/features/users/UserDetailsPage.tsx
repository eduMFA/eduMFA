import { Trans, useLingui } from "@lingui/react/macro";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import {
  UserAttributeFields,
  formatFieldValue,
  type UserFormValues
} from "./UserAttributeFields";
import { UserSidebar } from "./UserSidebar";
import { useApiClient } from "../../api/ApiClientProvider";
import { configQueryKeys, getResolver } from "../../api/config";
import {
  assignToken,
  getTokens,
  tokenQueryKeys,
  type TokenDetail,
  type TokenListParams
} from "../../api/tokens";
import {
  deleteCustomAttribute,
  deleteUser,
  getCustomAttributes,
  getEditableAttributes,
  getUserDetails,
  setCustomAttribute,
  updateUser,
  userQueryKeys,
  type UserDetail,
  type UserWriteRequest
} from "../../api/users";
import { useAuth } from "../../auth/AuthProvider";
import { hasEnrollRight, hasRight } from "../../auth/permissions";
import { ConfirmDialog } from "../../components/feedback/ConfirmDialog";
import { ErrorAlert } from "../../components/feedback/ErrorAlert";
import { InfoAlert } from "../../components/feedback/InfoAlert";
import { LoadingIndicator } from "../../components/feedback/LoadingIndicator";
import { SerialLookupField } from "../../components/forms/SerialLookupField";
import { Card } from "../../components/layout/Card";
import { PageHeader } from "../../components/layout/PageHeader";
import { SidebarLayout } from "../../components/layout/SidebarLayout";
import { EmptyState } from "../../components/tables/EmptyState";
import { Pagination } from "../../components/tables/Pagination";
import { pushFlash, type FlashMessage } from "../../lib/flash";
import { hashHref } from "../../lib/hashbang";
import { fixSerial } from "../../lib/serial";
import {
  fallbackUserFields,
  getResolverUserFields,
  type UserFieldDefinition
} from "../../lib/userAttributes";

/** The legacy details view listed five tokens per page. */
const USER_TOKEN_PAGE_SIZE = 5;

export function UserDetailsPage() {
  const { realm = "", user: username = "" } = useParams();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLingui();
  const { isAuthenticated, rights } = useAuth();
  const [flash, setFlash] = useState<FlashMessage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tokenPage, setTokenPage] = useState(1);

  // Like the legacy controller, start at the top when a user is opened.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [realm, username]);

  const canLoad = isAuthenticated && username.length > 0;

  const userQuery = useQuery({
    enabled: canLoad,
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
    enabled: canLoad && resolverName.length > 0,
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

  const tokenParams = useMemo<TokenListParams>(
    () => ({
      page: tokenPage,
      pagesize: USER_TOKEN_PAGE_SIZE,
      realm,
      user: username
    }),
    [realm, tokenPage, username]
  );
  const tokensQuery = useQuery({
    enabled: canLoad,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getTokens(apiClient, tokenParams, signal),
    queryKey: tokenQueryKeys.list(tokenParams)
  });

  const attributeParams = useMemo(() => ({ realm, user: username }), [realm, username]);
  const editableAttributesQuery = useQuery({
    enabled: canLoad,
    queryFn: ({ signal }) => getEditableAttributes(apiClient, attributeParams, signal),
    queryKey: userQueryKeys.editableAttributes(attributeParams)
  });
  const customAttributesQuery = useQuery({
    enabled: canLoad,
    queryFn: ({ signal }) => getCustomAttributes(apiClient, username, realm, signal),
    queryKey: userQueryKeys.customAttributes(username, realm)
  });

  const form = useForm<UserFormValues>({ mode: "onChange" });

  const invalidateUsers = () =>
    queryClient.invalidateQueries({ queryKey: userQueryKeys.all });

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
        setFlash({ message: t`Failed to update user.`, type: "danger" });

        return;
      }

      setIsEditing(false);
      setFlash({ message: t`User updated successfully.`, type: "info" });
      await invalidateUsers();

      const nextUsername = values.username ?? username;

      if (nextUsername !== username) {
        void navigate(
          `/user/details/${encodeURIComponent(realm)}/${encodeURIComponent(nextUsername)}`
        );
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(apiClient, resolverName, username),
    onSettled: () => {
      setIsDeleteDialogOpen(false);
    },
    onSuccess: async (deleted) => {
      if (!deleted) {
        setFlash({ message: t`Failed to delete user.`, type: "danger" });

        return;
      }

      await invalidateUsers();
      pushFlash(t`User deleted successfully.`);
      void navigate("/user/list");
    }
  });

  // Custom attributes: the policy response lists the keys that may be set
  // (with their allowed values) and deleted. "*" stands for free input.
  const [selectedAttributeKey, setSelectedAttributeKey] = useState("");
  const [customAttributeKey, setCustomAttributeKey] = useState("");
  const [selectedAttributeValue, setSelectedAttributeValue] = useState("");
  const [customAttributeValue, setCustomAttributeValue] = useState("");
  const settableAttributes = editableAttributesQuery.data?.set ?? {};
  const deletableAttributes = editableAttributesQuery.data?.delete ?? [];
  const settableKeys = Object.keys(settableAttributes);
  const allowedValues = settableAttributes[selectedAttributeKey] ?? [];
  const resolvedAttributeKey =
    selectedAttributeKey === "*" ? customAttributeKey.trim() : selectedAttributeKey;
  const resolvedAttributeValue =
    selectedAttributeValue === "*" ? customAttributeValue : selectedAttributeValue;
  const canAddAttribute =
    resolvedAttributeKey.length > 0 && resolvedAttributeValue.length > 0;
  const customAttributes = customAttributesQuery.data ?? {};
  const customAttributeEntries = Object.entries(customAttributes);
  const showCustomAttributes =
    settableKeys.length > 0 ||
    deletableAttributes.length > 0 ||
    customAttributeEntries.length > 0;

  const selectAttributeKey = (key: string) => {
    const values = settableAttributes[key] ?? [];

    setSelectedAttributeKey(key);
    setCustomAttributeKey("");
    setCustomAttributeValue("");
    // With a single allowed value there is nothing to choose, so preselect it.
    setSelectedAttributeValue(values.length === 1 ? (values[0] ?? "") : "");
  };

  const invalidateAttributes = async () => {
    await queryClient.invalidateQueries({
      queryKey: userQueryKeys.customAttributes(username, realm)
    });
    await queryClient.invalidateQueries({
      queryKey: userQueryKeys.detail(realm, username)
    });
  };

  const addAttributeMutation = useMutation({
    mutationFn: () =>
      setCustomAttribute(
        apiClient,
        username,
        realm,
        resolvedAttributeKey,
        resolvedAttributeValue
      ),
    onSuccess: async () => {
      selectAttributeKey(selectedAttributeKey);
      await invalidateAttributes();
    }
  });
  const deleteAttributeMutation = useMutation({
    mutationFn: (key: string) => deleteCustomAttribute(apiClient, username, realm, key),
    onSuccess: invalidateAttributes
  });

  const canDeleteAttribute = (key: string) =>
    deletableAttributes.includes(key) || deletableAttributes.includes("*");

  // Assign an existing token.
  const [assignSerial, setAssignSerial] = useState("");
  const [assignPin, setAssignPin] = useState("");
  const [assignPinRepeat, setAssignPinRepeat] = useState("");
  const pinsMatch = assignPin === assignPinRepeat;
  const canAssign = fixSerial(assignSerial).length > 0 && pinsMatch;
  const assignMutation = useMutation({
    mutationFn: () =>
      assignToken(apiClient, {
        pin: assignPin,
        realm,
        serial: fixSerial(assignSerial),
        user: username
      }),
    onSuccess: async () => {
      setAssignSerial("");
      setAssignPin("");
      setAssignPinRepeat("");
      setFlash({ message: t`Token assigned successfully.`, type: "info" });
      window.scrollTo(0, 0);
      await queryClient.invalidateQueries({ queryKey: tokenQueryKeys.all });
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

  const canEnroll = hasEnrollRight(rights);
  const enrollHref = hashHref(
    `/token/enroll/${encodeURIComponent(realm)}/${encodeURIComponent(username)}`
  );
  const tokenPageData = tokensQuery.data;
  const tokens = tokenPageData?.tokens ?? [];

  const userActions =
    userDetail?.editable && !isEditing ? (
      <>
        {hasRight(rights, "updateuser") ? (
          <button className="btn btn-primary" onClick={startEditing} type="button">
            <span className="glyphicon glyphicon-edit" aria-hidden="true" />
            <Trans>Edit user</Trans>
          </button>
        ) : null}
        {hasRight(rights, "deleteuser") ? (
          <button
            className="btn btn-danger"
            onClick={() => {
              setIsDeleteDialogOpen(true);
            }}
            type="button"
          >
            <span className="glyphicon glyphicon-trash" aria-hidden="true" />
            <Trans>Delete user</Trans>
          </button>
        ) : null}
      </>
    ) : null;

  const editFooter = isEditing ? (
    <>
      <button
        className="btn btn-primary"
        disabled={!form.formState.isValid || updateMutation.isPending}
        type="submit"
      >
        <span className="glyphicon glyphicon-save" aria-hidden="true" />
        <Trans>Save user</Trans>
      </button>
      <button className="btn btn-default" onClick={cancelEditing} type="button">
        <Trans>Cancel</Trans>
      </button>
    </>
  ) : undefined;

  return (
    <SidebarLayout
      sidebar={<UserSidebar activeItem="details" detailsUsername={username} />}
    >
      <PageHeader
        actions={
          <a
            className="btn btn-default"
            href={hashHref(`/audit/log?user=${encodeURIComponent(username)}`)}
          >
            <span className="glyphicon glyphicon-search" aria-hidden="true" />
            <Trans>View user in Audit log</Trans>
          </a>
        }
        subtitle={
          <>
            <Trans>Realm</Trans> <a href={hashHref("/config/realms/list")}>{realm}</a>
            {resolverName ? (
              <>
                {" · "}
                <Trans>Resolver</Trans> {resolverName}
              </>
            ) : null}
          </>
        }
        title={username}
      />

      {!isAuthenticated ? (
        <div className="alert alert-warning" role="alert">
          <Trans>
            Log in through the legacy UI before opening this migrated route.
          </Trans>
        </div>
      ) : null}

      <InfoAlert
        message={flash?.message ?? null}
        onDismiss={() => {
          setFlash(null);
        }}
        type={flash?.type}
      />
      <ErrorAlert error={userQuery.error} />
      <ErrorAlert error={updateMutation.error} />
      <ErrorAlert error={deleteMutation.error} />
      <ErrorAlert error={addAttributeMutation.error} />
      <ErrorAlert error={deleteAttributeMutation.error} />
      <ErrorAlert error={assignMutation.error} />

      {userQuery.isLoading ? (
        <LoadingIndicator label={<Trans>Loading user</Trans>} />
      ) : null}

      {userQuery.isSuccess && !userDetail ? (
        <div className="alert alert-warning" role="alert">
          <Trans>User not found.</Trans>
        </div>
      ) : null}

      {userDetail ? (
        <form
          noValidate
          onSubmit={(event) => {
            void submitUser(event);
          }}
        >
          <Card
            actions={userActions}
            footer={editFooter}
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
      ) : null}

      {userDetail && showCustomAttributes ? (
        <Card
          flush
          footer={
            settableKeys.length > 0 ? (
              <div className="react-inline-form">
                <label className="sr-only" htmlFor="attr_key">
                  <Trans>Custom attribute</Trans>
                </label>
                <select
                  className="form-control"
                  id="attr_key"
                  onChange={(event) => {
                    selectAttributeKey(event.target.value);
                  }}
                  value={selectedAttributeKey}
                >
                  <option value="">{t`Custom attribute`}</option>
                  {settableKeys.map((attributeKey) => (
                    <option key={attributeKey} value={attributeKey}>
                      {attributeKey}
                    </option>
                  ))}
                </select>
                {selectedAttributeKey === "*" ? (
                  <>
                    <label className="sr-only" htmlFor="new_custom_attribute_key">
                      <Trans>Custom attribute name</Trans>
                    </label>
                    <input
                      className="form-control"
                      id="new_custom_attribute_key"
                      onChange={(event) => {
                        setCustomAttributeKey(event.target.value);
                      }}
                      placeholder={t`Custom attribute name`}
                      type="text"
                      value={customAttributeKey}
                    />
                  </>
                ) : null}
                {allowedValues.length !== 1 ? (
                  <>
                    <label className="sr-only" htmlFor="attr_value">
                      <Trans>Custom attribute value</Trans>
                    </label>
                    <select
                      className="form-control"
                      id="attr_value"
                      onChange={(event) => {
                        setSelectedAttributeValue(event.target.value);
                        setCustomAttributeValue("");
                      }}
                      value={selectedAttributeValue}
                    >
                      <option value="">{t`Custom attribute value`}</option>
                      {allowedValues.map((attributeValue) => (
                        <option key={attributeValue} value={attributeValue}>
                          {attributeValue}
                        </option>
                      ))}
                    </select>
                  </>
                ) : null}
                {selectedAttributeValue === "*" ? (
                  <>
                    <label className="sr-only" htmlFor="new_custom_attribute_value">
                      <Trans>Custom attribute value</Trans>
                    </label>
                    <input
                      className="form-control"
                      id="new_custom_attribute_value"
                      onChange={(event) => {
                        setCustomAttributeValue(event.target.value);
                      }}
                      placeholder={t`Custom attribute value`}
                      type="text"
                      value={customAttributeValue}
                    />
                  </>
                ) : null}
                <button
                  className="btn btn-success"
                  disabled={!canAddAttribute || addAttributeMutation.isPending}
                  onClick={() => {
                    addAttributeMutation.mutate();
                  }}
                  type="button"
                >
                  <span className="glyphicon glyphicon-plus" aria-hidden="true" />
                  <Trans>Add</Trans>
                </button>
              </div>
            ) : undefined
          }
          title={<Trans>Custom attributes</Trans>}
        >
          <div className="table-responsive">
            <table className="table table-hover">
              <tbody>
                {customAttributeEntries.length === 0 ? (
                  <EmptyState
                    colSpan={3}
                    message={<Trans>No custom attributes set.</Trans>}
                  />
                ) : (
                  customAttributeEntries.map(([attributeKey, attributeValue]) => (
                    <tr key={attributeKey}>
                      <td className="col-sm-4">
                        <b>{attributeKey}</b>
                      </td>
                      <td className="col-sm-6">{attributeValue}</td>
                      <td className="col-sm-2 text-right">
                        {canDeleteAttribute(attributeKey) ? (
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={deleteAttributeMutation.isPending}
                            onClick={() => {
                              deleteAttributeMutation.mutate(attributeKey);
                            }}
                            type="button"
                          >
                            <Trans>Delete</Trans>
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <Card
        actions={
          <a
            aria-disabled={!canEnroll}
            className={canEnroll ? "btn btn-primary" : "btn btn-primary disabled"}
            href={canEnroll ? enrollHref : undefined}
            id="enrollButton"
          >
            <span className="glyphicon glyphicon-plus" aria-hidden="true" />
            <Trans>Enroll New Token</Trans>
          </a>
        }
        flush
        title={<Trans>Tokens</Trans>}
      >
        <ErrorAlert error={tokensQuery.error} />

        <Pagination
          currentPage={tokenPage}
          maxSize={5}
          onPageChange={setTokenPage}
          pageSize={USER_TOKEN_PAGE_SIZE}
          totalCount={tokenPageData?.count ?? 0}
        />

        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>
                  <Trans>serial</Trans>
                </th>
                <th>
                  <Trans>type</Trans>
                </th>
                <th>
                  <Trans>Active</Trans>
                </th>
                <th>
                  <Trans>window</Trans>
                </th>
                <th>
                  <Trans>description</Trans>
                </th>
                <th>
                  <Trans>failcounter</Trans>
                </th>
                <th>
                  <Trans>maxfail</Trans>
                </th>
                <th>
                  <Trans>otplen</Trans>
                </th>
              </tr>
            </thead>
            <tbody>
              {tokens.length === 0 && !tokensQuery.isLoading ? (
                <EmptyState colSpan={8} message={<Trans>No tokens assigned.</Trans>} />
              ) : (
                tokens.map((token) => (
                  <tr key={token.serial}>
                    <td>
                      <a
                        href={hashHref(
                          `/token/details/${encodeURIComponent(token.serial)}`
                        )}
                      >
                        {token.serial}
                      </a>
                    </td>
                    <td>{token.tokentype}</td>
                    <td>
                      {token.active ? (
                        <span className="label label-success">
                          <Trans>active</Trans>
                        </span>
                      ) : (
                        <span className="label label-danger">
                          <Trans>disabled</Trans>
                        </span>
                      )}
                    </td>
                    <td>{token.count_window}</td>
                    <td>{token.description}</td>
                    <td>
                      <span className={`label ${getFailCounterClassName(token)}`}>
                        {token.failcount}
                      </span>
                    </td>
                    <td>{token.maxfail}</td>
                    <td>{token.otplen}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {hasRight(rights, "assign") ? (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            assignMutation.mutate();
          }}
        >
          <Card
            footer={
              <button
                className="btn btn-primary"
                disabled={!canAssign || assignMutation.isPending}
                id="assignButton"
                type="submit"
              >
                <Trans>Assign Token</Trans>
              </button>
            }
            title={<Trans>Assign an existing token</Trans>}
          >
            <SerialLookupField
              id="assignSerial"
              onChange={setAssignSerial}
              placeholder={t`start typing a serial number of a token that is notassigned, yet.`}
              required
              unassignedOnly
              value={assignSerial}
            />
            <div className={pinsMatch ? "form-group" : "form-group has-error"}>
              <label htmlFor="assignPin">
                <Trans>PIN/Password</Trans>
              </label>
              <input
                autoComplete="new-password"
                className="form-control"
                id="assignPin"
                onChange={(event) => {
                  setAssignPin(event.target.value);
                }}
                placeholder={t`Type a PIN or password`}
                type="password"
                value={assignPin}
              />
              <input
                aria-label={t`Repeat PIN or password`}
                autoComplete="new-password"
                className="form-control"
                id="assignPinRepeat"
                onChange={(event) => {
                  setAssignPinRepeat(event.target.value);
                }}
                placeholder={t`Repeat PIN or password`}
                type="password"
                value={assignPinRepeat}
              />
              {!pinsMatch ? (
                <span className="help-block">
                  <Trans>The PINs do not match.</Trans>
                </span>
              ) : null}
            </div>
          </Card>
        </form>
      ) : null}

      <ConfirmDialog
        confirmLabel={
          <>
            <span className="glyphicon glyphicon-trash" aria-hidden="true" />
            <Trans>Delete User</Trans>
          </>
        }
        id="dialogUserDelete"
        isOpen={isDeleteDialogOpen}
        isPending={deleteMutation.isPending}
        message={
          <Trans>Do you really want to delete the user in the user store?</Trans>
        }
        onCancel={() => {
          setIsDeleteDialogOpen(false);
        }}
        onConfirm={() => {
          deleteMutation.mutate();
        }}
        title={<Trans>Delete User</Trans>}
      />
    </SidebarLayout>
  );
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

function getFailCounterClassName(token: TokenDetail): string {
  if (token.failcount >= token.maxfail) {
    return "label-danger";
  }

  if (token.failcount > 0) {
    return "label-warning";
  }

  return "label-success";
}
