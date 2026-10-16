import { Trans, useLingui } from "@lingui/react/macro";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { MachineSidebar } from "./MachineSidebar";
import { useApiClient } from "../../api/ApiClientProvider";
import {
  attachTokenToMachine,
  detachTokenFromMachine,
  formatMachineHostname,
  getApplicationDefinitions,
  getMachines,
  getMachineTokens,
  machineQueryKeys,
  saveMachineTokenOptions,
  type ApplicationOptionSpec,
  type MachineTokenAssignment,
  type MachineTokenParams
} from "../../api/machines";
import { useAuth } from "../../auth/AuthProvider";
import { hasRight } from "../../auth/permissions";
import { ErrorAlert } from "../../components/feedback/ErrorAlert";
import { LoadingIndicator } from "../../components/feedback/LoadingIndicator";
import { SerialLookupField } from "../../components/forms/SerialLookupField";
import { Card } from "../../components/layout/Card";
import { PageHeader } from "../../components/layout/PageHeader";
import { SidebarLayout } from "../../components/layout/SidebarLayout";
import { EmptyState } from "../../components/tables/EmptyState";
import { Pagination } from "../../components/tables/Pagination";
import { hashHref } from "../../lib/hashbang";
import { fixSerial } from "../../lib/serial";
import { capitalize } from "../../lib/strings";

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

  return (
    <SidebarLayout
      sidebar={<MachineSidebar activeItem="details" machineId={machineId} />}
    >
      <PageHeader
        subtitle={
          <>
            <Trans>Machine Resolver</Trans>{" "}
            <a
              href={hashHref(
                `/machine/list?resolver=${encodeURIComponent(machineResolver)}`
              )}
            >
              {machineResolver}
            </a>
          </>
        }
        title={<Trans>Machine {machineId}</Trans>}
      />

      {!isAuthenticated ? (
        <div className="alert alert-warning" role="alert">
          <Trans>
            Log in through the legacy UI before opening this migrated route.
          </Trans>
        </div>
      ) : null}

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
        <div className="alert alert-warning" role="alert">
          <Trans>Machine not found.</Trans>
        </div>
      ) : null}

      {machine ? (
        <Card title={<Trans>Details</Trans>}>
          <div className="row">
            <div className="col-sm-4">
              <div className="react-field">
                <span className="react-field__label">
                  <Trans>Hostname</Trans>
                </span>
                <div className="react-field__value">
                  {formatMachineHostname(machine.hostname)}
                </div>
              </div>
            </div>
            <div className="col-sm-4">
              <div className="react-field">
                <span className="react-field__label">
                  <Trans>Machine ID</Trans>
                </span>
                <div className="react-field__value">{machine.id}</div>
              </div>
            </div>
            <div className="col-sm-4">
              <div className="react-field">
                <span className="react-field__label">
                  <Trans>IP Address</Trans>
                </span>
                <div className="react-field__value">{machine.ip}</div>
              </div>
            </div>
          </div>
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

        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>
                  <Trans>Serial</Trans>
                </th>
                <th>
                  <Trans>Application</Trans>
                </th>
                <th>
                  <Trans>Options</Trans>
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visibleAssignments.length === 0 && !tokensQuery.isLoading ? (
                <EmptyState colSpan={4} message={<Trans>No tokens attached.</Trans>} />
              ) : (
                visibleAssignments.map((assignment) => {
                  const optionSpecs =
                    applications[assignment.application]?.options ?? {};
                  const isEditingRow = editingAssignmentId === assignment.id;

                  return (
                    <tr key={assignment.id}>
                      <td>
                        <a
                          href={hashHref(
                            `/token/details/${encodeURIComponent(assignment.serial)}`
                          )}
                        >
                          {assignment.serial}
                        </a>{" "}
                        <span className="label label-default">{assignment.type}</span>
                      </td>
                      <td>{assignment.application}</td>
                      <td>
                        {isEditingRow
                          ? Object.entries(optionSpecs).map(([name, spec]) => (
                              <ApplicationOptionInput
                                idPrefix={`option_${String(assignment.id)}`}
                                key={name}
                                name={name}
                                onChange={(value) => {
                                  setDraftOptions((previous) => ({
                                    ...previous,
                                    [name]: value
                                  }));
                                }}
                                spec={spec}
                                value={draftOptions[name]}
                              />
                            ))
                          : Object.keys(optionSpecs).map((name) => (
                              <div key={name}>
                                <b>{capitalize(name)}:</b> {assignment.options[name]}
                              </div>
                            ))}
                      </td>
                      <td className="text-right">
                        {isEditingRow ? (
                          <div className="btn-toolbar">
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={saveOptionsMutation.isPending}
                              onClick={() => {
                                saveOptionsMutation.mutate(assignment);
                              }}
                              type="button"
                            >
                              <Trans>Save Options</Trans>
                            </button>
                            <button
                              className="btn btn-default btn-sm"
                              onClick={() => {
                                setEditingAssignmentId(null);
                              }}
                              type="button"
                            >
                              <Trans>Cancel</Trans>
                            </button>
                          </div>
                        ) : (
                          <div className="btn-toolbar">
                            <button
                              className="btn btn-default btn-sm"
                              onClick={() => {
                                setDraftOptions({ ...assignment.options });
                                setEditingAssignmentId(assignment.id);
                              }}
                              type="button"
                            >
                              <Trans>Edit Options</Trans>
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              disabled={detachMutation.isPending}
                              onClick={() => {
                                detachMutation.mutate(assignment);
                              }}
                              type="button"
                            >
                              <Trans>Detach</Trans>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
              <button
                className="btn btn-primary"
                disabled={!canAttach || attachMutation.isPending}
                type="submit"
              >
                <Trans>Attach Token</Trans>
              </button>
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

            <div className="form-group">
              <label htmlFor="application">
                <Trans>Application</Trans>
              </label>
              <select
                className="form-control"
                id="application"
                onChange={(event) => {
                  setNewApplication(event.target.value);
                  setNewOptions({});
                }}
                required
                value={newApplication}
              >
                <option value="" />
                {applicationNames.map((applicationName) => (
                  <option key={applicationName} value={applicationName}>
                    {applicationName}
                  </option>
                ))}
              </select>
            </div>

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

interface ApplicationOptionInputProps {
  idPrefix: string;
  name: string;
  onChange: (value: boolean | string) => void;
  spec: ApplicationOptionSpec;
  value: boolean | string | undefined;
}

/**
 * One application option, rendered like the legacy template: a select when
 * the option lists allowed values, a checkbox for booleans, a text input
 * otherwise.
 */
function ApplicationOptionInput({
  idPrefix,
  name,
  onChange,
  spec,
  value
}: ApplicationOptionInputProps) {
  const inputId = `${idPrefix}_${name}`;
  const textValue = typeof value === "string" ? value : "";
  const isChecked = value === true || value === "True" || value === "true";

  return (
    <div className="form-group">
      <label htmlFor={inputId}>{capitalize(name)}</label>
      {spec.value ? (
        <select
          className="form-control"
          id={inputId}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          required={Boolean(spec.required)}
          value={textValue}
        >
          <option value="" />
          {spec.value.map((allowedValue) => (
            <option key={allowedValue} value={allowedValue}>
              {allowedValue}
            </option>
          ))}
        </select>
      ) : spec.type === "bool" ? (
        <div>
          <input
            checked={isChecked}
            id={inputId}
            onChange={(event) => {
              onChange(event.target.checked);
            }}
            type="checkbox"
          />
        </div>
      ) : (
        <input
          className="form-control"
          id={inputId}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          required={Boolean(spec.required)}
          type="text"
          value={textValue}
        />
      )}
      {spec.description ? <span className="help-block">{spec.description}</span> : null}
    </div>
  );
}
