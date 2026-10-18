import { Trans } from "@lingui/react/macro";
import { useState } from "react";

import { buildMachineAssignmentColumns } from "./machineAssignmentColumns";
import { useMachineAssignmentEditor } from "./useMachineAssignmentEditor";
import type { ApplicationDefinitions, MachineTokenAssignment } from "@/api/machines";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";
import { DataTable } from "@/components/tables/DataTable";
import { Pagination } from "@/components/tables/Pagination";

/** Like the legacy controller (`machinesPerPage`), paginated client-side. */
const MACHINE_PAGE_SIZE = 15;

export interface MachineAssignmentsCardProps {
  applications: ApplicationDefinitions;
  applicationsError: unknown;
  /** `undefined` until the first load has answered. */
  assignments: MachineTokenAssignment[] | undefined;
  loadError: unknown;
  /** Re-reads the assignments after a change. */
  onChanged: () => Promise<void>;
  serial: string;
}

/** The machines the token is attached to, with option editing and detach. */
export function MachineAssignmentsCard({
  applications,
  applicationsError,
  assignments,
  loadError,
  onChanged,
  serial
}: MachineAssignmentsCardProps) {
  const [page, setPage] = useState(1);
  const editor = useMachineAssignmentEditor({ onChanged, serial });
  const allAssignments = assignments ?? [];
  const pageStart = (page - 1) * MACHINE_PAGE_SIZE;
  const visibleAssignments = allAssignments.slice(
    pageStart,
    pageStart + MACHINE_PAGE_SIZE
  );
  const columns = buildMachineAssignmentColumns({ applications, editor });

  return (
    <Card flush title={<Trans>Machines this token is attached to</Trans>}>
      <ErrorAlert error={loadError} />
      <ErrorAlert error={applicationsError} />
      <ErrorAlert error={editor.detach.error} />
      <ErrorAlert error={editor.saveOptions.error} />

      <Pagination
        currentPage={page}
        maxSize={5}
        onPageChange={setPage}
        pageSize={MACHINE_PAGE_SIZE}
        totalCount={allAssignments.length}
      />

      <DataTable
        columns={columns}
        data={visibleAssignments}
        emptyMessage={<Trans>This token is not attached to any machine.</Trans>}
        getRowKey={(assignment) => String(assignment.id)}
        id="tabletokenmachines"
        isLoading={assignments === undefined}
        minWidth={820}
      />
    </Card>
  );
}
