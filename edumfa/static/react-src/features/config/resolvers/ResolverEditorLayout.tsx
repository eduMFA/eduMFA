import { Trans, useLingui } from "@lingui/react/macro";
import type { ReactNode } from "react";

import { ResolverSidebar } from "./ResolverSidebar";
import type { StoredResolver } from "./useResolverEditor";
import type { ResolverType } from "@/api/resolvers";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

export interface ResolverEditorLayoutProps {
  /** The form; rendered once the stored resolver (if any) is available. */
  children: ReactNode;
  resolverName: string;
  resolverType: ResolverType;
  stored: StoredResolver;
  title: ReactNode;
}

/**
 * Frame shared by the resolver editors: sidebar, heading, login and loading
 * states. The form itself is mounted only when its initial values are known,
 * so it can keep them in local state without syncing effects.
 */
export function ResolverEditorLayout({
  children,
  resolverName,
  resolverType,
  stored,
  title
}: ResolverEditorLayoutProps) {
  const { t } = useLingui();
  const { isAuthenticated } = useAuth();

  return (
    <SidebarLayout
      sidebar={
        <ResolverSidebar
          activeItem={resolverType}
          resolverName={resolverName || undefined}
        />
      }
    >
      <PageHeader title={title} />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={stored.error} />

      {stored.isLoading ? (
        <LoadingIndicator label={<Trans>Loading resolver</Trans>} />
      ) : null}

      {stored.notFound ? (
        <ErrorAlert
          error={new Error(t`Resolver ${resolverName} not found.`)}
          title={<Trans>Resolver not found.</Trans>}
        />
      ) : null}

      {isAuthenticated && stored.isReady && !stored.notFound ? children : null}
    </SidebarLayout>
  );
}
