import { Trans } from "@lingui/react/macro";
import { Anchor, Badge, Group } from "@mantine/core";

import { AssignmentActionsCell } from "./AssignmentActionsCell";
import { AssignmentOptionsCell } from "./AssignmentOptionsCell";
import type { AssignmentEditor } from "./useAssignmentEditor";
import type { ApplicationDefinitions, MachineTokenAssignment } from "@/api/machines";
import type { DataTableColumn } from "@/components/tables/DataTable";
import { hashHref } from "@/lib/hashbang";

/** The assignment table; the options and actions cells follow the row being edited. */
export function createAssignmentColumns(
  applications: ApplicationDefinitions,
  editor: AssignmentEditor
): DataTableColumn<MachineTokenAssignment>[] {
  return [
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
