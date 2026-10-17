import { Trans, useLingui } from "@lingui/react/macro";
import {
  Anchor,
  Badge,
  Button,
  Checkbox,
  Group,
  List,
  NativeSelect,
  Stack,
  Table,
  Text,
  TextInput
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useMemo, useState, type ReactNode } from "react";

import { EditableValueRow } from "./EditableValueRow";
import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, getRealms, getTokengroups } from "@/api/config";
import {
  disableToken,
  enableToken,
  resetFailCounter,
  revokeToken,
  setTokenDescription,
  setTokenGroups,
  setTokenProperties,
  setTokenRealms,
  verifyTokenEnrollment,
  type TokenDetail
} from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";
import { formatValidityPeriod, parseValidityPeriod } from "@/lib/dates";
import { saveBlobAsFile } from "@/lib/download";
import { notify } from "@/lib/notify";
import { truncate } from "@/lib/strings";
import { FailCounterBadge, TokenActiveBadge } from "@/features/tokens/tokenBadges";

export interface TokenPropertiesCardProps {
  onRefresh: () => Promise<void>;
  serial: string;
  token: TokenDetail;
}

/** Token info values the legacy view offered as downloads instead of text. */
const blobInfoKeys = ["certificate", "pkcs12"];

/**
 * Port of the properties table in `token.details.html`: status actions,
 * the editable counters and description, token info with the validity
 * period editor, realms and token groups.
 */
export function TokenPropertiesCard({
  onRefresh,
  serial,
  token
}: TokenPropertiesCardProps) {
  const apiClient = useApiClient();
  const { t } = useLingui();
  const { isAuthenticated, rights, settings, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { hideButtons } = settings;
  const isSpass = token.tokentype === "spass";
  const [verifyCode, setVerifyCode] = useState("");

  const realmsQuery = useQuery({
    enabled: isAuthenticated && isAdmin,
    queryFn: ({ signal }) => getRealms(apiClient, signal),
    queryKey: configQueryKeys.realms
  });
  const tokengroupsQuery = useQuery({
    enabled: isAuthenticated && isAdmin && hasRight(rights, "tokengroup_list"),
    queryFn: ({ signal }) => getTokengroups(apiClient, signal),
    queryKey: configQueryKeys.tokengroups
  });

  const propertiesMutation = useMutation({
    mutationFn: (properties: Record<string, boolean | number | string>) =>
      setTokenProperties(apiClient, serial, properties),
    onSuccess: onRefresh
  });
  const descriptionMutation = useMutation({
    mutationFn: (description: string) =>
      hasRight(rights, "setdescription")
        ? setTokenDescription(apiClient, serial, description)
        : setTokenProperties(apiClient, serial, { description }),
    onSuccess: onRefresh
  });
  const toggleActiveMutation = useMutation({
    mutationFn: () =>
      token.active ? disableToken(apiClient, serial) : enableToken(apiClient, serial),
    onSuccess: onRefresh
  });
  const revokeMutation = useMutation({
    mutationFn: () => revokeToken(apiClient, serial),
    onSuccess: onRefresh
  });
  const resetMutation = useMutation({
    mutationFn: () => resetFailCounter(apiClient, serial),
    onSuccess: onRefresh
  });
  const verifyMutation = useMutation({
    mutationFn: () =>
      verifyTokenEnrollment(apiClient, {
        serial,
        type: token.tokentype,
        verify: verifyCode
      }),
    onSuccess: async (verified) => {
      setVerifyCode("");
      notify(
        verified
          ? t`Enrollment successfully verified.`
          : t`Enrollment verification failed.`,
        verified ? "info" : "danger"
      );
      await onRefresh();
    }
  });
  const realmsMutation = useMutation({
    mutationFn: (realms: string[]) => setTokenRealms(apiClient, serial, realms),
    onSuccess: onRefresh
  });
  const groupsMutation = useMutation({
    mutationFn: (groups: string[]) => setTokenGroups(apiClient, serial, groups),
    onSuccess: onRefresh
  });

  // Realm and token group editing: a checkbox per known entry.
  const [selectedRealms, setSelectedRealms] = useState<string[] | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<string[] | null>(null);

  // Token info editing (the values go through `POST /token/set/<serial>`).
  const [infoDraft, setInfoDraft] = useState<InfoDraft | null>(null);
  const infoEntries = useMemo(() => Object.entries(token.info), [token.info]);

  const startEditInfo = () => {
    setInfoDraft({
      maxAuthCount: token.info.count_auth_max ?? "",
      maxSuccessAuthCount: token.info.count_auth_success_max ?? "",
      useTimeShift: token.info.useTimeShift ?? "default",
      validityEnd: parseValidityPeriod(token.info.validity_period_end),
      validityStart: parseValidityPeriod(token.info.validity_period_start)
    });
  };

  const saveInfo = () => {
    if (!infoDraft) {
      return;
    }

    const properties: Record<string, boolean | number | string> = {
      count_auth_max: infoDraft.maxAuthCount,
      count_auth_success_max: infoDraft.maxSuccessAuthCount,
      validity_period_end: formatValidityPeriod(infoDraft.validityEnd),
      validity_period_start: formatValidityPeriod(infoDraft.validityStart)
    };

    if (token.tokentype === "totp") {
      properties.use_timeshift = infoDraft.useTimeShift;
    }

    propertiesMutation.mutate(properties);
    setInfoDraft(null);
  };

  const invalidValidityPeriod =
    infoDraft?.validityStart && infoDraft.validityEnd
      ? infoDraft.validityStart > infoDraft.validityEnd
      : false;

  /**
   * Legacy pattern for action buttons: without the right the button is
   * disabled, and hidden altogether under the `hide_buttons` policy.
   */
  const actionButton = (right: string, button: ReactNode): ReactNode =>
    !hasRight(rights, right) && hideButtons ? null : button;

  const canEditRows = isAdmin && !token.locked;
  const editRowButtons = (
    isEditing: boolean,
    right: string,
    onEdit: () => void,
    onSave: () => void,
    onCancel: () => void,
    saveLabel: ReactNode,
    isSaving: boolean
  ): ReactNode => {
    if (!canEditRows) {
      return null;
    }

    if (isEditing) {
      return (
        <Group gap="xs" justify="flex-end">
          <Button loading={isSaving} onClick={onSave} size="xs">
            {saveLabel}
          </Button>
          <Button onClick={onCancel} size="xs" variant="default">
            <Trans>Cancel</Trans>
          </Button>
        </Group>
      );
    }

    return actionButton(
      right,
      <Button
        disabled={!hasRight(rights, right)}
        onClick={onEdit}
        size="xs"
        variant="default"
      >
        <Trans>Edit</Trans>
      </Button>
    );
  };

  const realmNames = Object.keys(realmsQuery.data ?? {}).sort((left, right) =>
    left.localeCompare(right)
  );
  const tokengroups = tokengroupsQuery.data ?? {};
  const toggleSelection = (
    setter: (update: (previous: string[] | null) => string[] | null) => void,
    name: string,
    checked: boolean
  ) => {
    setter((previous) => {
      const current = previous ?? [];

      return checked ? [...current, name] : current.filter((entry) => entry !== name);
    });
  };

  return (
    <Card flush title={<Trans>Token details</Trans>}>
      <ErrorAlert error={propertiesMutation.error} />
      <ErrorAlert error={descriptionMutation.error} />
      <ErrorAlert error={toggleActiveMutation.error} />
      <ErrorAlert error={revokeMutation.error} />
      <ErrorAlert error={resetMutation.error} />
      <ErrorAlert error={verifyMutation.error} />
      <ErrorAlert error={realmsMutation.error} />
      <ErrorAlert error={groupsMutation.error} />
      <ErrorAlert error={realmsQuery.error} />
      <ErrorAlert error={tokengroupsQuery.error} />

      <Table verticalSpacing="sm">
        <Table.Tbody>
          <Table.Tr>
            <Table.Td fw={600} w="25%">
              <Trans>Type</Trans>
            </Table.Td>
            <Table.Td data-field="tokentype">{token.tokentype}</Table.Td>
            <Table.Td w="30%" />
          </Table.Tr>

          <Table.Tr>
            <Table.Td fw={600}>
              <Trans>Active</Trans>
            </Table.Td>
            <Table.Td>
              <Group gap="xs">
                <TokenActiveBadge active={token.active} />
                {token.locked ? (
                  <Badge color="red" variant="light">
                    <Trans>locked</Trans>
                  </Badge>
                ) : null}
                {token.revoked ? (
                  <Badge color="red" variant="light">
                    <Trans>revoked</Trans>
                  </Badge>
                ) : null}
              </Group>
            </Table.Td>
            <Table.Td ta="right">
              <Group gap="xs" justify="flex-end">
                {token.active
                  ? actionButton(
                      "disable",
                      <Button
                        color="red"
                        disabled={!hasRight(rights, "disable")}
                        id="disableButton"
                        loading={toggleActiveMutation.isPending}
                        onClick={() => {
                          toggleActiveMutation.mutate();
                        }}
                        size="xs"
                        variant="light"
                      >
                        <Trans>Disable</Trans>
                      </Button>
                    )
                  : null}
                {!token.active && !token.locked
                  ? actionButton(
                      "enable",
                      <Button
                        color="green"
                        disabled={!hasRight(rights, "enable")}
                        id="enableButton"
                        loading={toggleActiveMutation.isPending}
                        onClick={() => {
                          toggleActiveMutation.mutate();
                        }}
                        size="xs"
                        variant="light"
                      >
                        <Trans>Enable</Trans>
                      </Button>
                    )
                  : null}
                {!token.revoked
                  ? actionButton(
                      "revoke",
                      <Button
                        color="red"
                        disabled={!hasRight(rights, "revoke")}
                        id="revokeButton"
                        loading={revokeMutation.isPending}
                        onClick={() => {
                          revokeMutation.mutate();
                        }}
                        size="xs"
                        variant="light"
                      >
                        <Trans>Revoke</Trans>
                      </Button>
                    )
                  : null}
              </Group>
            </Table.Td>
          </Table.Tr>

          {token.rollout_state ? (
            <Table.Tr>
              <Table.Td fw={600}>
                <Trans>Rollout State</Trans>
              </Table.Td>
              <Table.Td data-field="rollout_state">{token.rollout_state}</Table.Td>
              <Table.Td ta="right">
                {token.rollout_state === "verify" ? (
                  <Group gap="xs" justify="flex-end" wrap="nowrap">
                    <TextInput
                      aria-label={t`Enter code to verify enrollment`}
                      onChange={(event) => {
                        setVerifyCode(event.currentTarget.value);
                      }}
                      placeholder={t`Enter code to verify enrollment`}
                      size="xs"
                      value={verifyCode}
                    />
                    <Button
                      disabled={verifyCode.length === 0}
                      loading={verifyMutation.isPending}
                      onClick={() => {
                        verifyMutation.mutate();
                      }}
                      size="xs"
                    >
                      <Trans>Verify Token</Trans>
                    </Button>
                  </Group>
                ) : null}
              </Table.Td>
            </Table.Tr>
          ) : null}

          <EditableValueRow
            buttonLabel={<Trans>Set max fail</Trans>}
            canEdit={hasRight(rights, "set")}
            hideButtons={hideButtons}
            id="maxfail"
            inputType="number"
            isSaving={propertiesMutation.isPending}
            label={t`Maxfail`}
            locked={token.locked}
            onSave={(value) => {
              propertiesMutation.mutate({ max_failcount: value });
            }}
            value={String(token.maxfail)}
          />

          <Table.Tr>
            <Table.Td fw={600}>
              <Trans>Fail counter</Trans>
            </Table.Td>
            <Table.Td>
              <FailCounterBadge token={token} />
            </Table.Td>
            <Table.Td ta="right">
              {token.failcount > 0
                ? actionButton(
                    "reset",
                    <Button
                      color="green"
                      disabled={!hasRight(rights, "reset")}
                      id="resetButton"
                      loading={resetMutation.isPending}
                      onClick={() => {
                        resetMutation.mutate();
                      }}
                      size="xs"
                      variant="light"
                    >
                      <Trans>Reset fail counter</Trans>
                    </Button>
                  )
                : null}
            </Table.Td>
          </Table.Tr>

          {isSpass ? null : (
            <>
              <Table.Tr>
                <Table.Td fw={600}>
                  <Trans>OTP Length</Trans>
                </Table.Td>
                <Table.Td data-field="otplen">{token.otplen}</Table.Td>
                <Table.Td />
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={600}>
                  <Trans>Count</Trans>
                </Table.Td>
                <Table.Td data-field="count">{token.count}</Table.Td>
                <Table.Td />
              </Table.Tr>
              <EditableValueRow
                buttonLabel={<Trans>Set count window</Trans>}
                canEdit={hasRight(rights, "set")}
                hideButtons={hideButtons}
                id="count_window"
                inputType="number"
                isSaving={propertiesMutation.isPending}
                label={t`Count Window`}
                locked={token.locked}
                onSave={(value) => {
                  propertiesMutation.mutate({ count_window: value });
                }}
                value={String(token.count_window)}
              />
              <EditableValueRow
                buttonLabel={<Trans>Set sync window</Trans>}
                canEdit={hasRight(rights, "set")}
                hideButtons={hideButtons}
                id="sync_window"
                inputType="number"
                isSaving={propertiesMutation.isPending}
                label={t`Sync Window`}
                locked={token.locked}
                onSave={(value) => {
                  propertiesMutation.mutate({ sync_window: value });
                }}
                value={String(token.sync_window)}
              />
            </>
          )}

          <EditableValueRow
            buttonLabel={<Trans>Set description</Trans>}
            canEdit={
              hasRight(rights, "setdescription") || (isAdmin && hasRight(rights, "set"))
            }
            hideButtons={hideButtons}
            id="description"
            isSaving={descriptionMutation.isPending}
            label={t`Description`}
            locked={token.locked}
            maxLength={80}
            onSave={(value) => {
              descriptionMutation.mutate(value);
            }}
            value={token.description}
          />

          <Table.Tr>
            <Table.Td fw={600}>
              <Trans>Info</Trans>
            </Table.Td>
            <Table.Td>
              <Stack gap="xs">
                <List size="sm" spacing={2}>
                  {infoEntries.map(([key, value]) => (
                    <List.Item key={key}>
                      <TokenInfoEntry infoKey={key} serial={serial} value={value} />
                    </List.Item>
                  ))}
                </List>
                {infoDraft ? (
                  <Stack gap="xs">
                    <TextInput
                      id="max_auth_count"
                      inputMode="numeric"
                      label={<Trans>Maximum Authentication Count</Trans>}
                      onChange={(event) => {
                        setInfoDraft({
                          ...infoDraft,
                          maxAuthCount: event.currentTarget.value
                        });
                      }}
                      placeholder={t`Max allowed auths`}
                      size="sm"
                      type="number"
                      value={infoDraft.maxAuthCount}
                    />
                    <TextInput
                      id="max_success_auth_count"
                      inputMode="numeric"
                      label={<Trans>Maximum Success Auth Count</Trans>}
                      onChange={(event) => {
                        setInfoDraft({
                          ...infoDraft,
                          maxSuccessAuthCount: event.currentTarget.value
                        });
                      }}
                      placeholder={t`Max allowed successful auths`}
                      size="sm"
                      type="number"
                      value={infoDraft.maxSuccessAuthCount}
                    />
                    <DateTimePicker
                      clearable
                      id="validity_start"
                      label={<Trans>Validity Start</Trans>}
                      onChange={(value) => {
                        setInfoDraft({ ...infoDraft, validityStart: toDate(value) });
                      }}
                      size="sm"
                      value={infoDraft.validityStart}
                      valueFormat="YYYY-MM-DD HH:mm"
                    />
                    <DateTimePicker
                      clearable
                      error={
                        invalidValidityPeriod
                          ? t`End Date before Start Date!`
                          : undefined
                      }
                      id="validity_end"
                      label={<Trans>Validity End</Trans>}
                      onChange={(value) => {
                        setInfoDraft({ ...infoDraft, validityEnd: toDate(value) });
                      }}
                      size="sm"
                      value={infoDraft.validityEnd}
                      valueFormat="YYYY-MM-DD HH:mm"
                    />
                    {token.tokentype === "totp" ? (
                      <NativeSelect
                        data={["default", "True", "False"]}
                        description={
                          <Trans>
                            Set to 'True' or 'False' to override setting in Token
                            Config.
                          </Trans>
                        }
                        id="use_timeshift"
                        label={<Trans>Use Timeshift</Trans>}
                        onChange={(event) => {
                          setInfoDraft({
                            ...infoDraft,
                            useTimeShift: event.currentTarget.value
                          });
                        }}
                        size="sm"
                        value={infoDraft.useTimeShift}
                      />
                    ) : null}
                  </Stack>
                ) : null}
              </Stack>
            </Table.Td>
            <Table.Td ta="right">
              {editRowButtons(
                infoDraft !== null,
                "set",
                startEditInfo,
                saveInfo,
                () => {
                  setInfoDraft(null);
                },
                <Trans>Save Token Info</Trans>,
                propertiesMutation.isPending
              )}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Td fw={600}>
              <Trans>Realms</Trans>
            </Table.Td>
            <Table.Td>
              {selectedRealms ? (
                <Stack gap={4}>
                  {realmNames.map((realmName) => (
                    <Checkbox
                      checked={selectedRealms.includes(realmName)}
                      key={realmName}
                      label={realmName}
                      onChange={(event) => {
                        toggleSelection(
                          setSelectedRealms,
                          realmName,
                          event.currentTarget.checked
                        );
                      }}
                      size="sm"
                    />
                  ))}
                </Stack>
              ) : (
                <List data-field="realms" size="sm" spacing={2}>
                  {token.realms.map((realmName) => (
                    <List.Item key={realmName}>{realmName}</List.Item>
                  ))}
                </List>
              )}
            </Table.Td>
            <Table.Td ta="right">
              {editRowButtons(
                selectedRealms !== null,
                "tokenrealms",
                () => {
                  setSelectedRealms([...token.realms]);
                },
                () => {
                  realmsMutation.mutate(selectedRealms ?? []);
                  setSelectedRealms(null);
                },
                () => {
                  setSelectedRealms(null);
                },
                <Trans>Save realms</Trans>,
                realmsMutation.isPending
              )}
            </Table.Td>
          </Table.Tr>

          {hasRight(rights, "tokengroup_list") ? (
            <Table.Tr>
              <Table.Td fw={600}>
                <Trans>Token groups</Trans>
              </Table.Td>
              <Table.Td>
                {selectedGroups ? (
                  <Stack gap={4}>
                    {Object.entries(tokengroups).map(([groupName, group]) => (
                      <Checkbox
                        checked={selectedGroups.includes(groupName)}
                        key={groupName}
                        label={
                          group.description
                            ? `${groupName} (${group.description})`
                            : groupName
                        }
                        onChange={(event) => {
                          toggleSelection(
                            setSelectedGroups,
                            groupName,
                            event.currentTarget.checked
                          );
                        }}
                        size="sm"
                      />
                    ))}
                  </Stack>
                ) : (
                  <List data-field="tokengroup" size="sm" spacing={2}>
                    {(token.tokengroup ?? []).map((groupName) => (
                      <List.Item key={groupName}>{groupName}</List.Item>
                    ))}
                  </List>
                )}
              </Table.Td>
              <Table.Td ta="right">
                {editRowButtons(
                  selectedGroups !== null,
                  "tokengroups",
                  () => {
                    setSelectedGroups([...(token.tokengroup ?? [])]);
                  },
                  () => {
                    groupsMutation.mutate(selectedGroups ?? []);
                    setSelectedGroups(null);
                  },
                  () => {
                    setSelectedGroups(null);
                  },
                  <Trans>Save Token Groups</Trans>,
                  groupsMutation.isPending
                )}
              </Table.Td>
            </Table.Tr>
          ) : null}
        </Table.Tbody>
      </Table>
    </Card>
  );
}

interface InfoDraft {
  maxAuthCount: string;
  maxSuccessAuthCount: string;
  useTimeShift: string;
  validityEnd: Date | null;
  validityStart: Date | null;
}

/** Mantine's date pickers hand back a date or a formatted string. */
function toDate(value: Date | string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = typeof value === "string" ? dayjs(value) : dayjs(value);

  return parsed.isValid() ? parsed.toDate() : null;
}

/**
 * One token info entry. Certificates and PKCS12 blobs are offered as
 * downloads like the legacy view; the file is built when the link is
 * clicked, so no object URL has to be kept alive. Other values are
 * truncated to 35 characters with the full value in the tooltip.
 */
function TokenInfoEntry({
  infoKey,
  serial,
  value
}: {
  infoKey: string;
  serial: string;
  value: string;
}) {
  if (blobInfoKeys.includes(infoKey)) {
    const isPkcs12 = infoKey === "pkcs12";
    const download = () => {
      const blob = isPkcs12
        ? new Blob(
            [Uint8Array.from(atob(value), (character) => character.charCodeAt(0))],
            { type: "application/x-pkcs12" }
          )
        : new Blob([value], { type: "text/plain" });

      saveBlobAsFile(blob, isPkcs12 ? `${serial}.p12` : `${serial}.pem`);
    };

    return (
      <Anchor component="button" onClick={download} size="sm" type="button">
        {isPkcs12 ? <Trans>PKCS12</Trans> : <Trans>certificate</Trans>}
      </Anchor>
    );
  }

  return (
    <Text component="span" size="sm" title={value}>
      {infoKey}: {truncate(value, 35)}
    </Text>
  );
}
