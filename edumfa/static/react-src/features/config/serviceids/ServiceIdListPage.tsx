import { ServiceIdListHeader } from "./ServiceIdListHeader";
import { ServiceIdTable } from "./ServiceIdTable";
import { useServiceIdList } from "./useServiceIdList";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { useDeleteConfirmation } from "@/components/feedback/useDeleteConfirmation";
import { SystemLayout } from "@/features/config/system/SystemLayout";

/** Port of `config.serviceid.list.html` and the list part of `serviceidController`. */
export function ServiceIdListPage() {
  const { isAuthenticated, rights } = useAuth();
  const { dialog, requestDelete } = useDeleteConfirmation();
  const { deleteMutation, serviceIdsQuery } = useServiceIdList();
  const canAdd = hasRight(rights, "serviceid_add");
  const canDelete = hasRight(rights, "serviceid_delete");

  const deleteNamed = (servicename: string) => {
    requestDelete({
      identifier: servicename,
      onConfirm: () => {
        deleteMutation.mutate(servicename);
      }
    });
  };

  return (
    <SystemLayout activeItem="serviceid">
      <ServiceIdListHeader canAdd={canAdd} />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={serviceIdsQuery.error} />
      <ErrorAlert error={deleteMutation.error} />

      <ServiceIdTable
        canDelete={canDelete}
        data={serviceIdsQuery.data}
        deletingName={deleteMutation.isPending ? deleteMutation.variables : undefined}
        isLoading={serviceIdsQuery.isLoading}
        onDelete={deleteNamed}
      />

      {dialog}
    </SystemLayout>
  );
}
