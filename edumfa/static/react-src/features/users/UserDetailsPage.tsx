import { Trans, useLingui } from "@lingui/react/macro";
import {
  Anchor,
  Badge,
  Button,
  Group,
  NativeSelect,
  PasswordInput,
  Table,
  Text,
  TextInput
} from "@mantine/core";
import {
  IconDeviceFloppy,
  IconEdit,
  IconPlus,
  IconSearch,
  IconTrash
} from "@tabler/icons-react";
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
import { BooleanPill } from "../../components/feedback/BooleanPill";
import { ConfirmDialog } from "../../components/feedback/ConfirmDialog";
import { ErrorAlert } from "../../components/feedback/ErrorAlert";
import { LoadingIndicator } from "../../components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "../../components/feedback/LoginRequiredAlert";
import { SerialLookupField } from "../../components/forms/SerialLookupField";
import { Card } from "../../components/layout/Card";
import { PageHeader } from "../../components/layout/PageHeader";
import { SidebarLayout } from "../../components/layout/SidebarLayout";
import { DataTable, type DataTableColumn } from "../../components/tables/DataTable";
import { EmptyState } from "../../components/tables/EmptyState";
import { Pagination } from "../../components/tables/Pagination";
import { pushFlash } from "../../lib/flash";
import { hashHref } from "../../lib/hashbang";
import { notify } from "../../lib/notify";
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
        notify(t`Failed to update user.`, "danger");

        return;
      }

      setIsEditing(false);
      notify(t`User updated successfully.`, "success");
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
        notify(t`Failed to delete user.`, "danger");

        return;
      }

      await invalidateUsers();
      pushFlash(t`User deleted successfully.`, "success");
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
  const customAttributeEntries = Object.entries(customAttributesQuery.data ?? {});
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
      notify(t`Token assigned successfully.`, "success");
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

  const tokenColumns: DataTableColumn<TokenDetail>[] = [
    {
      header: <Trans>serial</Trans>,
      key: "serial",
      render: (token) => (
        <Anchor
          href={hashHref(`/token/details/${encodeURIComponent(token.serial)}`)}
          size="sm"
        >
          {token.serial}
        </Anchor>
      )
    },
    {
      header: <Trans>type</Trans>,
      key: "tokentype",
      render: (token) => token.tokentype
    },
    {
      header: <Trans>Active</Trans>,
      key: "active",
      render: (token) => (
        <BooleanPill
          falseLabel={<Trans>disabled</Trans>}
          trueLabel={<Trans>active</Trans>}
          value={token.active}
        />
      )
    },
    {
      header: <Trans>window</Trans>,
      key: "count_window",
      render: (token) => token.count_window
    },
    {
      header: <Trans>description</Trans>,
      key: "description",
      render: (token) => token.description
    },
    {
      header: <Trans>failcounter</Trans>,
      key: "failcount",
      render: (token) => (
        <Badge color={getFailCounterColor(token)} variant="light">
          {token.failcount}
        </Badge>
      )
    },
    {
      header: <Trans>maxfail</Trans>,
      key: "maxfail",
      render: (token) => token.maxfail
    },
    { header: <Trans>otplen</Trans>, key: "otplen", render: (token) => token.otplen }
  ];

  const userActions =
    userDetail?.editable && !isEditing ? (
      <>
        {hasRight(rights, "updateuser") ? (
          <Button leftSection={<IconEdit size={16} />} onClick={startEditing} size="sm">
            <Trans>Edit user</Trans>
          </Button>
        ) : null}
        {hasRight(rights, "deleteuser") ? (
          <Button
            color="red"
            leftSection={<IconTrash size={16} />}
            onClick={() => {
              setIsDeleteDialogOpen(true);
            }}
            size="sm"
            variant="light"
          >
            <Trans>Delete user</Trans>
          </Button>
        ) : null}
      </>
    ) : null;

  const editFooter = isEditing ? (
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
  ) : undefined;

  return (
    <SidebarLayout
      sidebar={<UserSidebar activeItem="details" detailsUsername={username} />}
    >
      <PageHeader
        actions={
          <Button
            component="a"
            href={hashHref(`/audit/log?user=${encodeURIComponent(username)}`)}
            leftSection={<IconSearch size={16} />}
            variant="default"
          >
            <Trans>View user in Audit log</Trans>
          </Button>
        }
        subtitle={
          <>
            <Trans>Realm</Trans>{" "}
            <Anchor href={hashHref("/config/realms/list")} size="sm">
              {realm}
            </Anchor>
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

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
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
        <ErrorAlert
          error={new Error(t`User not found.`)}
          title={<Trans>User not found.</Trans>}
        />
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
              <Group gap="xs">
                <NativeSelect
                  aria-label={t`Custom attribute`}
                  data={[{ label: t`Custom attribute`, value: "" }, ...settableKeys]}
                  id="attr_key"
                  onChange={(event) => {
                    selectAttributeKey(event.currentTarget.value);
                  }}
                  size="sm"
                  value={selectedAttributeKey}
                />
                {selectedAttributeKey === "*" ? (
                  <TextInput
                    aria-label={t`Custom attribute name`}
                    id="new_custom_attribute_key"
                    onChange={(event) => {
                      setCustomAttributeKey(event.currentTarget.value);
                    }}
                    placeholder={t`Custom attribute name`}
                    size="sm"
                    value={customAttributeKey}
                  />
                ) : null}
                {allowedValues.length !== 1 ? (
                  <NativeSelect
                    aria-label={t`Custom attribute value`}
                    data={[
                      { label: t`Custom attribute value`, value: "" },
                      ...allowedValues
                    ]}
                    id="attr_value"
                    onChange={(event) => {
                      setSelectedAttributeValue(event.currentTarget.value);
                      setCustomAttributeValue("");
                    }}
                    size="sm"
                    value={selectedAttributeValue}
                  />
                ) : null}
                {selectedAttributeValue === "*" ? (
                  <TextInput
                    aria-label={t`Custom attribute value`}
                    id="new_custom_attribute_value"
                    onChange={(event) => {
                      setCustomAttributeValue(event.currentTarget.value);
                    }}
                    placeholder={t`Custom attribute value`}
                    size="sm"
                    value={customAttributeValue}
                  />
                ) : null}
                <Button
                  disabled={!canAddAttribute}
                  leftSection={<IconPlus size={16} />}
                  loading={addAttributeMutation.isPending}
                  onClick={() => {
                    addAttributeMutation.mutate();
                  }}
                  size="sm"
                >
                  <Trans>Add</Trans>
                </Button>
              </Group>
            ) : undefined
          }
          title={<Trans>Custom attributes</Trans>}
        >
          <Table verticalSpacing="sm">
            <Table.Tbody>
              {customAttributeEntries.length === 0 ? (
                <EmptyState
                  colSpan={3}
                  message={<Trans>No custom attributes set.</Trans>}
                />
              ) : (
                customAttributeEntries.map(([attributeKey, attributeValue]) => (
                  <Table.Tr key={attributeKey}>
                    <Table.Td fw={600} w="30%">
                      {attributeKey}
                    </Table.Td>
                    <Table.Td>{attributeValue}</Table.Td>
                    <Table.Td ta="right" w="20%">
                      {canDeleteAttribute(attributeKey) ? (
                        <Button
                          color="red"
                          loading={deleteAttributeMutation.isPending}
                          onClick={() => {
                            deleteAttributeMutation.mutate(attributeKey);
                          }}
                          size="xs"
                          variant="light"
                        >
                          <Trans>Delete</Trans>
                        </Button>
                      ) : null}
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Card>
      ) : null}

      <Card
        actions={
          <Button
            aria-disabled={!canEnroll}
            component="a"
            data-disabled={!canEnroll}
            href={canEnroll ? enrollHref : undefined}
            id="enrollButton"
            leftSection={<IconPlus size={16} />}
            onClick={
              canEnroll
                ? undefined
                : (event) => {
                    event.preventDefault();
                  }
            }
            size="sm"
          >
            <Trans>Enroll New Token</Trans>
          </Button>
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

        <DataTable
          columns={tokenColumns}
          data={tokens}
          emptyMessage={<Trans>No tokens assigned.</Trans>}
          getRowKey={(token) => token.serial}
          isLoading={tokensQuery.isLoading}
          minWidth={760}
        />
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
              <Button
                disabled={!canAssign}
                id="assignButton"
                loading={assignMutation.isPending}
                type="submit"
              >
                <Trans>Assign Token</Trans>
              </Button>
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
            <PasswordInput
              autoComplete="new-password"
              id="assignPin"
              label={<Trans>PIN/Password</Trans>}
              mb="sm"
              onChange={(event) => {
                setAssignPin(event.currentTarget.value);
              }}
              placeholder={t`Type a PIN or password`}
              value={assignPin}
            />
            <PasswordInput
              aria-label={t`Repeat PIN or password`}
              autoComplete="new-password"
              error={pinsMatch ? undefined : t`The PINs do not match.`}
              id="assignPinRepeat"
              onChange={(event) => {
                setAssignPinRepeat(event.currentTarget.value);
              }}
              placeholder={t`Repeat PIN or password`}
              value={assignPinRepeat}
            />
          </Card>
        </form>
      ) : null}

      <ConfirmDialog
        confirmLabel={<Trans>Delete User</Trans>}
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

      {userDetail ? null : <Text size="sm" />}
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

function getFailCounterColor(token: TokenDetail): string {
  if (token.failcount >= token.maxfail) {
    return "red";
  }

  if (token.failcount > 0) {
    return "yellow";
  }

  return "green";
}
