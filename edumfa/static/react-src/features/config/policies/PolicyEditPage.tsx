import { Trans, useLingui } from "@lingui/react/macro";
import { Alert } from "@mantine/core";
import { useParams } from "react-router-dom";

import { PolicyEditor } from "./PolicyEditor";
import { PolicySidebar } from "./PolicySidebar";
import { usePolicyEditPageQueries } from "./usePolicyEditPageQueries";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { AccessGate } from "@/components/feedback/AccessGate";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

export function PolicyEditPage() {
  const { t } = useLingui();

  const { policyname = "" } = useParams();
  const { canOpen, conditionsQuery, definitionsQuery, isAuthenticated, policyQuery } =
    usePolicyEditPageQueries(policyname);
  const policy = policyQuery.data?.find((item) => item.name === policyname);
  const notFound = !!policyname && policyQuery.isSuccess && !policy;
  const loading =
    definitionsQuery.isLoading || conditionsQuery.isLoading || policyQuery.isLoading;

  return (
    <SidebarLayout sidebar={<PolicySidebar active={policyname ? "edit" : "add"} />}>
      <PageHeader
        title={
          policyname ? <Trans>Edit Policy {policyname}</Trans> : t`Create a new Policy`
        }
      />
      <AccessGate
        allowed={canOpen}
        deniedMessage={t`You do not have permission to open this policy page.`}
        isAuthenticated={isAuthenticated}
      >
        <ErrorAlert
          error={policyQuery.error ?? definitionsQuery.error ?? conditionsQuery.error}
        />
        {loading ? <LoadingIndicator /> : null}
        {notFound ? (
          <Alert color="yellow" role="alert">
            <Trans>Policy {policyname} was not found.</Trans>
          </Alert>
        ) : null}
        {definitionsQuery.data && conditionsQuery.data && (!policyname || policy) ? (
          <PolicyEditor
            key={policyname}
            policy={policy}
            definitions={definitionsQuery.data}
            conditionDefinitions={conditionsQuery.data}
          />
        ) : null}
      </AccessGate>
    </SidebarLayout>
  );
}
