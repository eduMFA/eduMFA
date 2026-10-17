import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor, Button, NativeSelect, PasswordInput, Table } from "@mantine/core";
import { IconUserMinus, IconUserPlus } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, getDefaultRealmName, getRealms } from "@/api/config";
import { assignToken, unassignToken, type TokenDetail } from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { UserLookupField } from "@/components/forms/UserLookupField";
import { Card } from "@/components/layout/Card";
import { pushFlash } from "@/lib/flash";
import { hashHref } from "@/lib/hashbang";
import { notify } from "@/lib/notify";
import { fixUser } from "@/lib/users";

export interface TokenUserCardProps {
  onRefresh: () => Promise<void>;
  serial: string;
  token: TokenDetail;
}

/**
 * Port of the user section in `token.details.html`: the assigned user with
 * the unassign action, or the assign form for an unassigned token. A user
 * who unassigns their own token is sent back to the list like the legacy
 * controller did.
 */
export function TokenUserCard({ onRefresh, serial, token }: TokenUserCardProps) {
  const apiClient = useApiClient();
  const navigate = useNavigate();
  const { t } = useLingui();
  const { isAuthenticated, rights, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isUser = user?.role === "user";
  const isAssigned = Boolean(token.user_id);
  const [selectedRealm, setSelectedRealm] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [pinRepeat, setPinRepeat] = useState("");

  const showAssignForm = hasRight(rights, "assign") && !isAssigned && !token.locked;
  const realmsQuery = useQuery({
    enabled: isAuthenticated && isAdmin && showAssignForm,
    queryFn: ({ signal }) => getRealms(apiClient, signal),
    queryKey: configQueryKeys.realms
  });
  const realmNames = Object.keys(realmsQuery.data ?? {}).sort((left, right) =>
    left.localeCompare(right)
  );
  const defaultRealm = realmsQuery.data
    ? (getDefaultRealmName(realmsQuery.data) ?? "")
    : "";
  // Users may only assign within their own realm; admins pick one.
  const activeRealm = isAdmin ? selectedRealm || defaultRealm : (user?.realm ?? "");

  const unassignMutation = useMutation({
    mutationFn: () => unassignToken(apiClient, serial),
    onSuccess: async () => {
      if (isUser) {
        pushFlash(t`Token unassigned.`, "success");
        void navigate("/token/list");

        return;
      }

      await onRefresh();
    }
  });
  const assignMutation = useMutation({
    mutationFn: () =>
      assignToken(apiClient, {
        pin,
        realm: activeRealm,
        serial,
        user: fixUser(username)
      }),
    onSuccess: async () => {
      setUsername("");
      setPin("");
      setPinRepeat("");
      notify(t`Token assigned successfully.`, "success");
      await onRefresh();
    }
  });

  const pinsMatch = pin === pinRepeat;
  const canAssign = fixUser(username).length > 0 && activeRealm.length > 0 && pinsMatch;

  return (
    <>
      {isAdmin && isAssigned ? (
        <Card
          actions={
            token.locked ? null : (
              <Button
                color="yellow"
                id="unassignAdminButton"
                leftSection={<IconUserMinus size={16} />}
                loading={unassignMutation.isPending}
                onClick={() => {
                  unassignMutation.mutate();
                }}
                size="sm"
                variant="light"
              >
                <Trans>Unassign User</Trans>
              </Button>
            )
          }
          flush
          title={<Trans>Assigned User</Trans>}
        >
          <ErrorAlert error={unassignMutation.error} />
          <Table verticalSpacing="sm">
            <Table.Tbody>
              <Table.Tr>
                <Table.Td fw={600} w="25%">
                  <Trans>Username</Trans>
                </Table.Td>
                <Table.Td>
                  <Anchor
                    href={hashHref(
                      `/user/details/${encodeURIComponent(token.user_realm)}/${encodeURIComponent(token.username)}`
                    )}
                    size="sm"
                  >
                    {token.username}
                  </Anchor>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={600}>
                  <Trans>Realm</Trans>
                </Table.Td>
                <Table.Td>
                  <Anchor href={hashHref("/config/realms/list")} size="sm">
                    {token.user_realm}
                  </Anchor>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={600}>
                  <Trans>Resolver</Trans>
                </Table.Td>
                <Table.Td>
                  <Anchor href={hashHref("/config/resolvers/list")} size="sm">
                    {token.resolver}
                  </Anchor>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={600}>
                  <Trans>User Id</Trans>
                </Table.Td>
                <Table.Td data-field="user_id">{token.user_id}</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Card>
      ) : null}

      {isUser && !token.locked && hasRight(rights, "unassign") ? (
        <Card>
          <ErrorAlert error={unassignMutation.error} />
          <Button
            color="yellow"
            id="unassignUserButton"
            leftSection={<IconUserMinus size={16} />}
            loading={unassignMutation.isPending}
            onClick={() => {
              unassignMutation.mutate();
            }}
            variant="light"
          >
            <Trans>Unassign Token</Trans>
          </Button>
        </Card>
      ) : null}

      {showAssignForm ? (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();

            if (canAssign) {
              assignMutation.mutate();
            }
          }}
        >
          <Card
            footer={
              <Button
                disabled={!canAssign}
                id="assignButton"
                leftSection={<IconUserPlus size={16} />}
                loading={assignMutation.isPending}
                type="submit"
              >
                <Trans>Assign User</Trans>
              </Button>
            }
            title={<Trans>Assign User</Trans>}
          >
            <ErrorAlert error={assignMutation.error} />
            <ErrorAlert error={realmsQuery.error} />
            {isAdmin ? (
              <NativeSelect
                data={realmNames}
                id="assignRealm"
                label={<Trans>Realm</Trans>}
                mb="sm"
                onChange={(event) => {
                  setSelectedRealm(event.currentTarget.value);
                  setUsername("");
                }}
                value={activeRealm}
              />
            ) : null}
            <UserLookupField
              id="assignUsername"
              onChange={setUsername}
              realm={activeRealm}
              required
              value={username}
            />
            <PasswordInput
              autoComplete="new-password"
              id="assignUserPin"
              label={<Trans>PIN/Password</Trans>}
              mb="sm"
              onChange={(event) => {
                setPin(event.currentTarget.value);
              }}
              placeholder={t`Type a PIN or password`}
              value={pin}
            />
            <PasswordInput
              aria-label={t`Repeat PIN or password`}
              autoComplete="new-password"
              error={pinsMatch ? undefined : t`The PINs do not match.`}
              id="assignUserPinRepeat"
              onChange={(event) => {
                setPinRepeat(event.currentTarget.value);
              }}
              placeholder={t`Repeat PIN or password`}
              value={pinRepeat}
            />
          </Card>
        </form>
      ) : null}
    </>
  );
}
