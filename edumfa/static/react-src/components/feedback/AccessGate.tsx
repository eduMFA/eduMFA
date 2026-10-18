import { Alert } from "@mantine/core";
import type { ReactNode } from "react";

import { LoginRequiredAlert } from "./LoginRequiredAlert";

export interface AccessGateProps {
  /** The session holds the right the page needs. */
  allowed: boolean;
  children: ReactNode;
  /** Shown in place of the page when the session lacks the right. */
  deniedMessage: ReactNode;
  isAuthenticated: boolean;
}

/** Renders the login hint, the denied message or the page, whichever applies first. */
export function AccessGate({
  allowed,
  children,
  deniedMessage,
  isAuthenticated
}: AccessGateProps) {
  if (!isAuthenticated) {
    return <LoginRequiredAlert />;
  }

  if (!allowed) {
    return (
      <Alert color="yellow" role="alert">
        {deniedMessage}
      </Alert>
    );
  }

  return children;
}
