import { useLingui } from "@lingui/react/macro";
import { Box, SimpleGrid } from "@mantine/core";

import { AdministrationCard } from "./AdministrationCard";
import { AuthenticationsCard } from "./AuthenticationsCard";
import { EventsCard } from "./EventsCard";
import { PoliciesCard } from "./PoliciesCard";
import { TokenCountsCard } from "./TokenCountsCard";
import { useDashboardData } from "./useDashboardData";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { PageHeader } from "@/components/layout/PageHeader";

/**
 * Port of `dashboard.html`: the admin start page with token counts, the
 * authentications of the last day, recent administration and the policy
 * and event overview. Each panel is gated by the same right as the legacy
 * template.
 */
export function DashboardPage() {
  const { t } = useLingui();

  const { isAuthenticated, rights } = useAuth();
  const canListTokens = isAuthenticated && hasRight(rights, "tokenlist");
  const canReadAudit = isAuthenticated && hasRight(rights, "auditlog");
  const canReadPolicies = isAuthenticated && hasRight(rights, "policyread");
  const canReadEvents = isAuthenticated && hasRight(rights, "eventhandling_read");
  const data = useDashboardData({
    canListTokens,
    canReadAudit,
    canReadEvents,
    canReadPolicies
  });

  return (
    <Box className="react-migration-shell">
      <PageHeader title={t`Dashboard`} />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={data.firstError} />

      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
        {canListTokens ? <TokenCountsCard counts={data.tokenCounts} /> : null}

        {canReadAudit ? (
          <AuthenticationsCard
            failureCount={data.failureCount}
            failures={data.failures}
            successCount={data.successCount}
          />
        ) : null}

        {canReadAudit ? <AdministrationCard entries={data.administration} /> : null}

        {canReadPolicies ? (
          <PoliciesCard
            activePolicies={data.activePolicies}
            inactivePolicies={data.inactivePolicies}
          />
        ) : null}

        {canReadEvents ? (
          <EventsCard
            activeEvents={data.activeEvents}
            inactiveEvents={data.inactiveEvents}
          />
        ) : null}
      </SimpleGrid>
    </Box>
  );
}
