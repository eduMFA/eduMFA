import { Trans } from "@lingui/react/macro";
import { Anchor, Button, Group, NativeSelect, Text } from "@mantine/core";
import { IconDeviceFloppy, IconEdit, IconLink, IconUnlink } from "@tabler/icons-react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { useState } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  attachTokenToMachine,
  detachTokenFromMachine,
  formatMachineHostname,
  getApplicationDefinitions,
  getMachineTokens,
  machineQueryKeys,
  saveMachineTokenOptions,
  type MachineTokenAssignment
} from "@/api/machines";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { ApplicationOptionInput } from "@/components/forms/ApplicationOptionInput";
import { MachineLookupField } from "@/components/forms/MachineLookupField";
import { Card } from "@/components/layout/Card";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Pagination } from "@/components/tables/Pagination";
import { hashHref } from "@/lib/hashbang";
import { fixMachine } from "@/lib/machine";
import { capitalize } from "@/lib/strings";

/** Like the legacy controller (`machinesPerPage`), paginated client-side. */
const MACHINE_PAGE_SIZE = 15;

export interface TokenMachinesCardProps {
  locked: boolean;
  serial: string;
}

/**
 * Port of the machines section in `token.details.html`: the machines the
 * token is attached to (with option editing and detach) and the form that
 * attaches it to another machine. "offline" attachments carry no machine.
 */
export function TokenMachinesCard({ locked, serial }: TokenMachinesCardProps) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null);
  const [draftOptions, setDraftOptions] = useState<Record<string, boolean | string>>(
    {}
  );
  const [newApplication, setNewApplication] = useState("");
  const [newMachine, setNewMachine] = useState("");
  const [newOptions, setNewOptions] = useState<Record<string, boolean | string>>({});

  const tokenParams = { serial };
  const machinesQuery = useQuery({
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => getMachineTokens(apiClient, tokenParams, signal),
    queryKey: machineQueryKeys.tokens(tokenParams)
  });
  const applicationsQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getApplicationDefinitions(apiClient, signal),
    queryKey: machineQueryKeys.applicationDefinitions
  });

  const applications = applicationsQuery.data ?? {};
  const applicationNames = Object.keys(applications);
  const assignments = machinesQuery.data ?? [];
  const pageStart = (page - 1) * MACHINE_PAGE_SIZE;
  const visibleAssignments = assignments.slice(
    pageStart,
    pageStart + MACHINE_PAGE_SIZE
  );

  const invalidateMachines = () =>
    queryClient.invalidateQueries({ queryKey: machineQueryKeys.tokens(tokenParams) });

  const isOffline = newApplication === "offline";
  const machineReference = fixMachine(newMachine);
  const newApplicationOptions = applications[newApplication]?.options ?? {};
  const hasMissingRequiredOption = Object.entries(newApplicationOptions).some(
    ([name, spec]) => spec.required && !newOptions[name]
  );
  const canAttach =
    newApplication.length > 0 &&
    (isOffline || machineReference.id.length > 0) &&
    !hasMissingRequiredOption;

  const attachMutation = useMutation({
    mutationFn: () =>
      attachTokenToMachine(apiClient, {
        ...newOptions,
        application: newApplication,
        // Offline tokens are deliberately not bound to a machine.
        machineid: isOffline ? "0" : machineReference.id,
        resolver: isOffline ? "" : machineReference.resolver,
        serial
      }),
    onSuccess: async () => {
      setNewApplication("");
      setNewMachine("");
      setNewOptions({});
      await invalidateMachines();
    }
  });
  const detachMutation = useMutation({
    mutationFn: (assignment: MachineTokenAssignment) =>
      detachTokenFromMachine(apiClient, {
        application: assignment.application,
        mtid: assignment.id,
        serial
      }),
    onSuccess: invalidateMachines
  });
  const saveOptionsMutation = useMutation({
    mutationFn: (assignment: MachineTokenAssignment) =>
      saveMachineTokenOptions(apiClient, { ...draftOptions, mtid: assignment.id }),
    onSuccess: async () => {
      setEditingAssignmentId(null);
      await invalidateMachines();
    }
  });

  const columns: DataTableColumn<MachineTokenAssignment>[] = [
    {
      header: <Trans>Machine ID</Trans>,
      key: "machine_id",
      render: (assignment) =>
        assignment.machine_id && assignment.resolver ? (
          <Anchor
            href={hashHref(
              `/machine/details/${encodeURIComponent(assignment.machine_id)}/${encodeURIComponent(assignment.resolver)}`
            )}
            size="sm"
          >
            {assignment.machine_id}
          </Anchor>
        ) : (
          assignment.machine_id
        )
    },
    {
      header: <Trans>Hostname</Trans>,
      key: "hostname",
      render: (assignment) => formatMachineHostname(assignment.hostname ?? null)
    },
    {
      header: <Trans>Resolver</Trans>,
      key: "resolver",
      render: (assignment) => assignment.resolver
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
    <>
      <Card flush title={<Trans>Machines this token is attached to</Trans>}>
        <ErrorAlert error={machinesQuery.error} />
        <ErrorAlert error={applicationsQuery.error} />
        <ErrorAlert error={detachMutation.error} />
        <ErrorAlert error={saveOptionsMutation.error} />

        <Pagination
          currentPage={page}
          maxSize={5}
          onPageChange={setPage}
          pageSize={MACHINE_PAGE_SIZE}
          totalCount={assignments.length}
        />

        <DataTable
          columns={columns}
          data={visibleAssignments}
          emptyMessage={<Trans>This token is not attached to any machine.</Trans>}
          getRowKey={(assignment) => String(assignment.id)}
          id="tabletokenmachines"
          isLoading={machinesQuery.data === undefined}
          minWidth={820}
        />
      </Card>

      {locked ? null : (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();

            if (canAttach) {
              attachMutation.mutate();
            }
          }}
        >
          <Card
            footer={
              <Button
                disabled={!canAttach}
                id="attachMachineButton"
                leftSection={<IconLink size={16} />}
                loading={attachMutation.isPending}
                type="submit"
              >
                <Trans>Attach Machine</Trans>
              </Button>
            }
            title={<Trans>Attach to a new Machine</Trans>}
          >
            <ErrorAlert error={attachMutation.error} />
            <NativeSelect
              data={[{ label: "", value: "" }, ...applicationNames]}
              id="attachApplication"
              label={<Trans>Application</Trans>}
              mb="sm"
              onChange={(event) => {
                setNewApplication(event.currentTarget.value);
                setNewOptions({});
              }}
              required
              value={newApplication}
            />
            {isOffline ? null : (
              <MachineLookupField
                id="attachMachine"
                onChange={setNewMachine}
                required
                value={newMachine}
              />
            )}
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
      )}
    </>
  );
}
