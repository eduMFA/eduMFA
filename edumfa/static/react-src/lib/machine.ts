import type { MachineDetail } from "@/api/machines";
import { formatMachineHostname } from "@/api/machines";

export interface MachineReference {
  hostname: string;
  id: string;
  ip: string;
  resolver: string;
}

/**
 * Formats a machine the way the legacy attach-machine typeahead did:
 * "<hostname> [<ip>] (<id> in <resolver>)", so `fixMachine` can read it back.
 */
export function formatMachineSuggestion(machine: MachineDetail): string {
  return `${formatMachineHostname(machine.hostname)} [${machine.ip ?? ""}] (${machine.id} in ${machine.resolver_name})`;
}

/** Port of the legacy global `fixMachine`; unknown input yields empty fields. */
export function fixMachine(value: string | null | undefined): MachineReference {
  const match = value ? /^(.*) \[(.*)\] \((.*) in (.*)\)$/.exec(value) : null;

  if (!match) {
    return { hostname: "", id: "", ip: "", resolver: "" };
  }

  return {
    hostname: match[1] ?? "",
    id: match[3] ?? "",
    ip: match[2] ?? "",
    resolver: match[4] ?? ""
  };
}
