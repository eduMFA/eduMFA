import { useLingui } from "@lingui/react/macro";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

import { MachineSidebar } from "./MachineSidebar";
import { AttachTokenCard } from "./details/AttachTokenCard";
import { MachineDetailsCard } from "./details/MachineDetailsCard";
import { MachineDetailsHeader } from "./details/MachineDetailsHeader";
import { MachineTokensCard } from "./details/MachineTokensCard";
import { useAssignmentEditor } from "./details/useAssignmentEditor";
import { useAttachToken } from "./details/useAttachToken";
import { useMachineDetails } from "./details/useMachineDetails";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

export function MachineDetailsPage() {
  const { id: machineId = "", resolver: machineResolver = "" } = useParams();
  const { t } = useLingui();
  const { isAuthenticated, rights } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [machineId, machineResolver]);

  const canLoad = isAuthenticated && machineId.length > 0;
  const details = useMachineDetails(machineId, machineResolver, canLoad);
  const { applications, applicationsQuery, invalidateTokens, machine, machineQuery } =
    details;
  const attach = useAttachToken({
    applications,
    invalidateTokens,
    machineId,
    machineResolver
  });
  const editor = useAssignmentEditor(invalidateTokens);

  return (
    <SidebarLayout
      sidebar={<MachineSidebar activeItem="details" machineId={machineId} />}
    >
      <MachineDetailsHeader machineId={machineId} machineResolver={machineResolver} />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={machineQuery.error} />
      <ErrorAlert error={applicationsQuery.error} />
      <ErrorAlert error={details.tokensQuery.error} />
      <ErrorAlert error={attach.mutation.error} />
      <ErrorAlert error={editor.detachMutation.error} />
      <ErrorAlert error={editor.saveOptionsMutation.error} />

      {machineQuery.isLoading ? <LoadingIndicator label={t`Loading machine`} /> : null}

      {machineQuery.isSuccess && !machine ? (
        <ErrorAlert
          error={new Error(t`Machine not found.`)}
          title={t`Machine not found.`}
        />
      ) : null}

      {machine ? <MachineDetailsCard machine={machine} /> : null}

      <MachineTokensCard
        applications={applications}
        assignments={details.assignments}
        editor={editor}
        isLoading={details.tokensQuery.isLoading}
      />

      {hasRight(rights, "manage_machine_tokens") ? (
        <AttachTokenCard applicationNames={details.applicationNames} attach={attach} />
      ) : null}
    </SidebarLayout>
  );
}
