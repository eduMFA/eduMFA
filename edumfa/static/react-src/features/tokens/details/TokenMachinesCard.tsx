import { AttachMachineForm } from "@/features/tokens/details/machines/AttachMachineForm";
import { MachineAssignmentsCard } from "@/features/tokens/details/machines/MachineAssignmentsCard";
import { useTokenMachineQueries } from "@/features/tokens/details/machines/useTokenMachineQueries";

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
  const { applicationsQuery, invalidateMachines, machinesQuery } =
    useTokenMachineQueries(serial);
  const applications = applicationsQuery.data ?? {};

  return (
    <>
      <MachineAssignmentsCard
        applications={applications}
        applicationsError={applicationsQuery.error}
        assignments={machinesQuery.data}
        loadError={machinesQuery.error}
        onChanged={invalidateMachines}
        serial={serial}
      />

      {locked ? null : (
        <AttachMachineForm
          applications={applications}
          onAttached={invalidateMachines}
          serial={serial}
        />
      )}
    </>
  );
}
