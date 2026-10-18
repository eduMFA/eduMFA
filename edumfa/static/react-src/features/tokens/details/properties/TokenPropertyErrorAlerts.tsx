import type { TokenPropertyMutations } from "./useTokenPropertyMutations";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";

export interface TokenPropertyErrorAlertsProps {
  mutations: TokenPropertyMutations;
}

/** The failed requests of the properties table, shown above it. */
export function TokenPropertyErrorAlerts({ mutations }: TokenPropertyErrorAlertsProps) {
  return (
    <>
      <ErrorAlert error={mutations.setProperties.error} />
      <ErrorAlert error={mutations.setDescription.error} />
      <ErrorAlert error={mutations.toggleActive.error} />
      <ErrorAlert error={mutations.revoke.error} />
      <ErrorAlert error={mutations.reset.error} />
      <ErrorAlert error={mutations.verify.error} />
      <ErrorAlert error={mutations.setRealms.error} />
      <ErrorAlert error={mutations.setGroups.error} />
      <ErrorAlert error={mutations.realmsQuery.error} />
      <ErrorAlert error={mutations.tokengroupsQuery.error} />
    </>
  );
}
