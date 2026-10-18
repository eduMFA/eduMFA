import { Trans } from "@lingui/react/macro";
import { Anchor } from "@mantine/core";

import { AssignmentActionsCell } from "./AssignmentActionsCell";
import { AssignmentOptionsCell } from "./AssignmentOptionsCell";
import type { MachineAssignmentEditor } from "./useMachineAssignmentEditor";
import {
  formatMachineHostname,
  type ApplicationDefinitions,
  type MachineTokenAssignment
} from "@/api/machines";
import type { DataTableColumn } from "@/components/tables/DataTable";
import { hashHref } from "@/lib/hashbang";

export interface MachineAssignmentColumnsParams {
  applications: ApplicationDefinitions;
  editor: MachineAssignmentEditor;
}

/** The columns of the assignments table; option editing goes through `editor`. */
export function buildMachineAssignmentColumns({
  applications,
  editor
}: MachineAssignmentColumnsParams): DataTableColumn<MachineTokenAssignment>[] {
  return [
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
      render: (assignment) => (
        <AssignmentOptionsCell
          assignment={assignment}
          editor={editor}
          optionSpecs={applications[assignment.application]?.options ?? {}}
        />
      )
    },
    {
      align: "right",
      header: "",
      key: "actions",
      render: (assignment) => (
        <AssignmentActionsCell assignment={assignment} editor={editor} />
      )
    }
  ];
}
