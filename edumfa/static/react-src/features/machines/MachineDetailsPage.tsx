import { Trans, useLingui } from "@lingui/react/macro";
import {
  Anchor,
  Badge,
  Button,
  Group,
  NativeSelect,
  SimpleGrid,
  Text
} from "@mantine/core";
import { IconDeviceFloppy, IconEdit, IconUnlink } from "@tabler/icons-react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { MachineSidebar } from "./MachineSidebar";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  attachTokenToMachine,
  detachTokenFromMachine,
  formatMachineHostname,
  getApplicationDefinitions,
  getMachines,
  getMachineTokens,
  machineQueryKeys,
  saveMachineTokenOptions,
  type MachineTokenAssignment,
  type MachineTokenParams
} from "@/api/machines";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { FieldValue } from "@/components/forms/FieldValue";
import { SerialLookupField } from "@/components/forms/SerialLookupField";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { ApplicationOptionInput } from "@/components/forms/ApplicationOptionInput";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Pagination } from "@/components/tables/Pagination";
import { hashHref } from "@/lib/hashbang";
import { fixSerial } from "@/lib/serial";
import { capitalize } from "@/lib/strings";

/** The legacy details view listed five assignments per page. */
const MACHINE_TOKEN_PAGE_SIZE = 5;

type OptionValues = Record<string, boolean | string>;

export function MachineDetailsPage() {
  const { id: machineId = "", resolver: machineResolver = "" } = useParams();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { t } = useLingui();
  const { isAuthenticated, rights } = useAuth();
  const [page, setPage] = useState(1);
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null);
  const [draftOptions, setDraftOptions] = useState<OptionValues>({});
  const [newSerial, setNewSerial] = useState("");
  const [newApplication, setNewApplication] = useState("");
  const [newOptions, setNewOptions] = useState<OptionValues>({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [machineId, machineResolver]);

  const canLoad = isAuthenticated && machineId.length > 0;
  const machineParams = useMemo(
    () => ({ id: machineId, resolver: machineResolver }),
    [machineId, machineResolver]
  );
  const machineQuery = useQuery({
    enabled: canLoad,
    queryFn: async ({ signal }) => {
      const machines = await getMachines(apiClient, machineParams, signal);

      return machines[0] ?? null;
    },
    queryKey: machineQueryKeys.list(machineParams)
  });

  const tokenParams = useMemo<MachineTokenParams>(
    () => ({ machineid: machineId, resolver: machineResolver }),
    [machineId, machineResolver]
  );
  const tokensQuery = useQuery({
    enabled: canLoad,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getMachineTokens(apiClient, tokenParams, signal),
    queryKey: machineQueryKeys.tokens(tokenParams)
  });

  const applicationsQuery = useQuery({
    enabled: canLoad,
    queryFn: ({ signal }) => getApplicationDefinitions(apiClient, signal),
    queryKey: machineQueryKeys.applicationDefinitions
  });

  const machine = machineQuery.data ?? null;
  const applications = applicationsQuery.data ?? {};
  // "offline" tokens are attached through the token views, not here.
  const applicationNames = Object.keys(applications).filter(
    (name) => name !== "offline"
  );
  const assignments = tokensQuery.data ?? [];
  const pageStart = (page - 1) * MACHINE_TOKEN_PAGE_SIZE;
  const visibleAssignments = assignments.slice(
    pageStart,
    pageStart + MACHINE_TOKEN_PAGE_SIZE
  );

  const invalidateTokens = () =>
    queryClient.invalidateQueries({ queryKey: machineQueryKeys.tokens(tokenParams) });

  const newApplicationOptions = applications[newApplication]?.options ?? {};
  const hasMissingRequiredOption = Object.entries(newApplicationOptions).some(
    ([name, spec]) => spec.required && !newOptions[name]
  );
  const canAttach =
    fixSerial(newSerial).length > 0 &&
    newApplication.length > 0 &&
    !hasMissingRequiredOption;

  const attachMutation = useMutation({
    mutationFn: () =>
      attachTokenToMachine(apiClient, {
        ...newOptions,
        application: newApplication,
        machineid: machineId,
        resolver: machineResolver,
        serial: fixSerial(newSerial)
      }),
    onSuccess: async () => {
      setNewSerial("");
      setNewApplication("");
      setNewOptions({});
      await invalidateTokens();
    }
  });

  const detachMutation = useMutation({
    mutationFn: (assignment: MachineTokenAssignment) =>
      detachTokenFromMachine(apiClient, {
        application: assignment.application,
        mtid: assignment.id,
        serial: assignment.serial
      }),
    onSuccess: invalidateTokens
  });

  const saveOptionsMutation = useMutation({
    mutationFn: (assignment: MachineTokenAssignment) =>
      saveMachineTokenOptions(apiClient, { ...draftOptions, mtid: assignment.id }),
    onSuccess: async () => {
      setEditingAssignmentId(null);
      await invalidateTokens();
    }
  });

  const assignmentColumns: DataTableColumn<MachineTokenAssignment>[] = [
    {
      header: <Trans>Serial</Trans>,
      key: "serial",
      render: (assignment) => (
        <Group gap="xs">
          <Anchor
            href={hashHref(`/token/details/${encodeURIComponent(assignment.serial)}`)}
            size="sm"
          >
            {assignment.serial}
          </Anchor>
          {assignment.type ? (
            <Badge color="gray" variant="light">
              {assignment.type}
            </Badge>
          ) : null}
        </Group>
      )
    },
    {
      header: <Trans>Application</Trans>,
      key: "application",
      render: (assignment) => assignment.application
    },
    {
      header: <Trans>Options</Trans>,
      key: "options",
      render: (assignment) => {
        const optionSpecs = applications[assignment.application]?.options ?? {};

        if (editingAssignmentId === assignment.id) {
          return Object.entries(optionSpecs).map(([name, spec]) => (
            <ApplicationOptionInput
              idPrefix={`option_${String(assignment.id)}`}
              key={name}
              name={name}
              onChange={(value) => {
                setDraftOptions((previous) => ({ ...previous, [name]: value }));
              }}
              spec={spec}
              value={draftOptions[name]}
            />
          ));
        }

        return Object.keys(optionSpecs).map((name) => (
          <Text key={name} size="sm">
            <b>{capitalize(name)}:</b> {assignment.options[name]}
          </Text>
        ));
      }
    },
    {
      align: "right",
      header: "",
      key: "actions",
      render: (assignment) =>
        editingAssignmentId === assignment.id ? (
          <Group gap="xs" justify="flex-end">
            <Button
              leftSection={<IconDeviceFloppy size={14} />}
              loading={saveOptionsMutation.isPending}
              onClick={() => {
                saveOptionsMutation.mutate(assignment);
              }}
              size="xs"
            >
              <Trans>Save Options</Trans>
            </Button>
            <Button
              onClick={() => {
                setEditingAssignmentId(null);
              }}
              size="xs"
              variant="default"
            >
              <Trans>Cancel</Trans>
            </Button>
          </Group>
        ) : (
          <Group gap="xs" justify="flex-end">
            <Button
              leftSection={<IconEdit size={14} />}
              onClick={() => {
                setDraftOptions({ ...assignment.options });
                setEditingAssignmentId(assignment.id);
              }}
              size="xs"
              variant="default"
            >
              <Trans>Edit Options</Trans>
            </Button>
            <Button
              color="red"
              leftSection={<IconUnlink size={14} />}
              loading={detachMutation.isPending}
              onClick={() => {
                detachMutation.mutate(assignment);
              }}
              size="xs"
              variant="light"
            >
              <Trans>Detach</Trans>
            </Button>
          </Group>
        )
    }
  ];

  return (
    <SidebarLayout
      sidebar={<MachineSidebar activeItem="details" machineId={machineId} />}
    >
      <PageHeader
        subtitle={
          <>
            <Trans>Machine Resolver</Trans>{" "}
            <Anchor
              href={hashHref(
                `/machine/list?resolver=${encodeURIComponent(machineResolver)}`
              )}
              size="sm"
            >
              {machineResolver}
            </Anchor>
          </>
        }
        title={<Trans>Machine {machineId}</Trans>}
      />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={machineQuery.error} />
      <ErrorAlert error={applicationsQuery.error} />
      <ErrorAlert error={tokensQuery.error} />
      <ErrorAlert error={attachMutation.error} />
      <ErrorAlert error={detachMutation.error} />
      <ErrorAlert error={saveOptionsMutation.error} />

      {machineQuery.isLoading ? (
        <LoadingIndicator label={<Trans>Loading machine</Trans>} />
      ) : null}

      {machineQuery.isSuccess && !machine ? (
        <ErrorAlert
          error={new Error(t`Machine not found.`)}
          title={<Trans>Machine not found.</Trans>}
        />
      ) : null}

      {machine ? (
        <Card title={<Trans>Details</Trans>}>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" verticalSpacing={0}>
            <FieldValue label={<Trans>Hostname</Trans>} name="hostname">
              {formatMachineHostname(machine.hostname)}
            </FieldValue>
            <FieldValue label={<Trans>Machine ID</Trans>} name="id">
              {machine.id}
            </FieldValue>
            <FieldValue label={<Trans>IP Address</Trans>} name="ip">
              {machine.ip}
            </FieldValue>
          </SimpleGrid>
        </Card>
      ) : null}

      <Card flush title={<Trans>Tokens and Applications</Trans>}>
        <Pagination
          currentPage={page}
          maxSize={5}
          onPageChange={setPage}
          pageSize={MACHINE_TOKEN_PAGE_SIZE}
          totalCount={assignments.length}
        />

        <DataTable
          columns={assignmentColumns}
          data={visibleAssignments}
          emptyMessage={<Trans>No tokens attached.</Trans>}
          getRowKey={(assignment) => String(assignment.id)}
          isLoading={tokensQuery.isLoading}
          minWidth={720}
        />
      </Card>

      {hasRight(rights, "manage_machine_tokens") ? (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            attachMutation.mutate();
          }}
        >
          <Card
            footer={
              <Button
                disabled={!canAttach}
                loading={attachMutation.isPending}
                type="submit"
              >
                <Trans>Attach Token</Trans>
              </Button>
            }
            title={<Trans>Attach a new token</Trans>}
          >
            <SerialLookupField
              id="attachSerial"
              includeUser
              onChange={setNewSerial}
              placeholder={t`start typing a serial number of a token.`}
              value={newSerial}
            />

            <NativeSelect
              data={[{ label: "", value: "" }, ...applicationNames]}
              id="application"
              label={<Trans>Application</Trans>}
              mb="sm"
              onChange={(event) => {
                setNewApplication(event.currentTarget.value);
                setNewOptions({});
              }}
              required
              value={newApplication}
            />

            {Object.entries(newApplicationOptions).map(([name, spec]) => (
              <ApplicationOptionInput
                idPrefix="option"
                key={name}
                name={name}
                onChange={(value) => {
                  setNewOptions((previous) => ({ ...previous, [name]: value }));
                }}
                spec={spec}
                value={newOptions[name]}
              />
            ))}
          </Card>
        </form>
      ) : null}
    </SidebarLayout>
  );
}
