import { useLingui } from "@lingui/react/macro";
import { useState } from "react";

import { createAssignmentColumns } from "./assignmentColumns";
import type { AssignmentEditor } from "./useAssignmentEditor";
import type { ApplicationDefinitions, MachineTokenAssignment } from "@/api/machines";
import { Card } from "@/components/layout/Card";
import { DataTable } from "@/components/tables/DataTable";
import { Pagination } from "@/components/tables/Pagination";

/** The legacy details view listed five assignments per page. */
const MACHINE_TOKEN_PAGE_SIZE = 5;

export interface MachineTokensCardProps {
  applications: ApplicationDefinitions;
  assignments: MachineTokenAssignment[];
  editor: AssignmentEditor;
  isLoading: boolean;
}

/** The tokens attached to the machine, paginated client-side. */
export function MachineTokensCard({
  applications,
  assignments,
  editor,
  isLoading
}: MachineTokensCardProps) {
  const { t } = useLingui();

  const [page, setPage] = useState(1);
  const pageStart = (page - 1) * MACHINE_TOKEN_PAGE_SIZE;
  const visibleAssignments = assignments.slice(
    pageStart,
    pageStart + MACHINE_TOKEN_PAGE_SIZE
  );

  return (
    <Card flush title={t`Tokens and Applications`}>
      <Pagination
        currentPage={page}
        maxSize={5}
        onPageChange={setPage}
        pageSize={MACHINE_TOKEN_PAGE_SIZE}
        totalCount={assignments.length}
      />

      <DataTable
        columns={createAssignmentColumns(applications, editor)}
        data={visibleAssignments}
        emptyMessage={t`No tokens attached.`}
        getRowKey={(assignment) => String(assignment.id)}
        isLoading={isLoading}
        minWidth={720}
      />
    </Card>
  );
}
