import { useLingui } from "@lingui/react/macro";
import { Anchor } from "@mantine/core";

import {
  type ApplicationFilterName,
  type ApplicationFilters,
  type ApplicationName
} from "./types";
import { type MachineTokenAssignment } from "@/api/machines";
import { ColumnFilter } from "@/components/tables/ColumnFilter";
import { type DataTableColumn } from "@/components/tables/DataTable";
import { hashHref } from "@/lib/hashbang";

export interface MachineTokenColumnOptions {
  application: ApplicationName;
  draftFilters: ApplicationFilters;
  onFilterChange: (name: ApplicationFilterName, value: string) => void;
  onFilterSubmit: () => void;
}

/**
 * The per-application columns (`token.applications.ssh.html`,
 * `token.applications.offline.html`); the serial column is shared.
 */
export function useMachineTokenColumns({
  application,
  draftFilters,
  onFilterChange,
  onFilterSubmit
}: MachineTokenColumnOptions): DataTableColumn<MachineTokenAssignment>[] {
  const { t } = useLingui();

  const filterFor = (name: ApplicationFilterName, label: string) => (
    <ColumnFilter
      label={label}
      onChange={(value) => {
        onFilterChange(name, value);
      }}
      onSubmit={onFilterSubmit}
      value={draftFilters[name] ?? ""}
    />
  );

  const serialColumn: DataTableColumn<MachineTokenAssignment> = {
    filter: filterFor("serial", t`serial`),
    header: t`serial`,
    key: "serial",
    render: (assignment) => (
      <Anchor
        href={hashHref(`/token/details/${encodeURIComponent(assignment.serial)}`)}
        size="sm"
      >
        {assignment.serial}
      </Anchor>
    ),
    sortKey: "serial"
  };

  return application === "ssh"
    ? [
        serialColumn,
        {
          filter: filterFor("service_id", t`Service ID`),
          header: t`Service ID`,
          key: "service_id",
          render: (assignment) => assignment.options.service_id,
          sortKey: "service_id"
        },
        {
          filter: filterFor("user", t`SSH user`),
          header: t`SSH user`,
          key: "user",
          render: (assignment) => assignment.options.user,
          sortKey: "user"
        }
      ]
    : [
        serialColumn,
        {
          filter: filterFor("count", t`Count`),
          header: t`Count`,
          key: "count",
          render: (assignment) => assignment.options.count,
          sortKey: "count"
        },
        {
          filter: filterFor("rounds", t`Rounds`),
          header: t`Rounds`,
          key: "rounds",
          render: (assignment) => assignment.options.rounds,
          sortKey: "rounds"
        }
      ];
}
