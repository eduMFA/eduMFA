import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor } from "@mantine/core";

import type { MachineFilters, MachineList } from "./useMachineList";
import { formatMachineHostname, type MachineDetail } from "@/api/machines";
import { ColumnFilter } from "@/components/tables/ColumnFilter";
import type { DataTableColumn } from "@/components/tables/DataTable";
import { hashHref } from "@/lib/hashbang";

export type MachineListColumnsParams = Pick<MachineList, "filters" | "setFilter">;

/** The machine list columns with their header filters. */
export function useMachineListColumns({
  filters,
  setFilter
}: MachineListColumnsParams): DataTableColumn<MachineDetail>[] {
  const { t } = useLingui();

  const filterFor = (name: keyof MachineFilters, label: string) => (
    <ColumnFilter
      label={label}
      onChange={(value) => {
        setFilter(name, value);
      }}
      value={filters[name]}
    />
  );

  return [
    {
      filter: filterFor("hostname", t`hostname`),
      header: <Trans>hostname</Trans>,
      key: "hostname",
      render: (machine) => (
        <Anchor
          href={hashHref(
            `/machine/details/${encodeURIComponent(machine.id)}/${encodeURIComponent(machine.resolver_name)}`
          )}
          size="sm"
        >
          {formatMachineHostname(machine.hostname)}
        </Anchor>
      )
    },
    {
      filter: filterFor("ip", t`IP Address`),
      header: <Trans>IP Address</Trans>,
      key: "ip",
      render: (machine) => machine.ip
    },
    {
      filter: filterFor("id", t`Id`),
      header: <Trans>Id</Trans>,
      key: "id",
      render: (machine) => machine.id
    },
    {
      filter: filterFor("resolver", t`Machine Resolver`),
      header: <Trans>Machine Resolver</Trans>,
      key: "resolver_name",
      render: (machine) => machine.resolver_name
    }
  ];
}
