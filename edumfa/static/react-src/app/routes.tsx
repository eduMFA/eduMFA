import { Route, Routes } from "react-router-dom";

import { normalizeHashRoute } from "./bootstrap";
import { AuditLogPage } from "@/features/audit/AuditLogPage";
import { ClientTypePage } from "@/features/components/ClientTypePage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { LoginPage } from "@/features/login/LoginPage";
import { OfflinePage } from "@/features/login/OfflinePage";
import { PinChangePage } from "@/features/login/PinChangePage";
import { ResponsePage } from "@/features/login/ResponsePage";
import { RecoveryPage } from "@/features/recovery/RecoveryPage";
import { RecoveryResetPage } from "@/features/recovery/RecoveryResetPage";
import { RegisterPage } from "@/features/register/RegisterPage";
import { MachineDetailsPage } from "@/features/machines/MachineDetailsPage";
import { MachineListPage } from "@/features/machines/MachineListPage";
import { TokenApplicationsPage } from "@/features/tokens/TokenApplicationsPage";
import { TokenAssignPage } from "@/features/tokens/TokenAssignPage";
import { TokenChallengesPage } from "@/features/tokens/TokenChallengesPage";
import { TokenDetailsPage } from "@/features/tokens/details/TokenDetailsPage";
import { EnrollTokenPage } from "@/features/tokens/enroll/EnrollTokenPage";
import { TokenGetSerialPage } from "@/features/tokens/TokenGetSerialPage";
import { TokenImportPage } from "@/features/tokens/TokenImportPage";
import { TokenListPage } from "@/features/tokens/TokenListPage";
import { TokenLostPage } from "@/features/tokens/TokenLostPage";
import { UserAddPage } from "@/features/users/UserAddPage";
import { UserDetailsPage } from "@/features/users/UserDetailsPage";
import { UserListPage } from "@/features/users/UserListPage";
import { UserPasswordPage } from "@/features/users/UserPasswordPage";

export const migratedRoutePaths = [
  "/login",
  "/response",
  "/pinchange",
  "/offline",
  "/component/clienttype",
  "/register",
  "/recovery",
  "/reset/:user/:recoverycode",
  "/audit/log",
  "/user/list",
  "/user/details/:realm/:user",
  "/user/add",
  "/user/password",
  "/machine/list",
  "/machine/details/:id/:resolver",
  "/token/list",
  "/token/assign",
  "/token/getserial",
  "/token/challenges",
  "/token/details/:serial",
  "/token/lost/:serial",
  "/token/applications/:application",
  "/token/import",
  "/token/enroll",
  "/token/enroll/:realmname/:username",
  "/token/rollover/:tokenType/:tokenSerial",
  "/token/wizard",
  "/dashboard"
] as const;

export type MigratedRoutePath = (typeof migratedRoutePaths)[number];

/**
 * ui-router's `initial_login` state has the empty URL, so an empty hash
 * (`/`, `#!` or `#!/`) shows the login page. The allowlists only name
 * `/login`; the alias keeps both spellings together.
 */
const routeAliases: Record<string, string> = { "/": "/login" };

/**
 * React takes a hash route over from Angular only when the Flask allowlist
 * enables it AND this bundle actually ships a page for it. A stale bundle or
 * a typo in `EDUMFA_REACT_ROUTES` therefore falls back to Angular instead of
 * hiding it behind an empty React shell.
 */
export function shouldReactOwnRoute(
  route: string,
  allowlist: readonly string[]
): boolean {
  return (
    isRouteMigrated(route, allowlist) && isRouteMigrated(route, migratedRoutePaths)
  );
}

export function isRouteMigrated(route: string, allowlist: readonly string[]): boolean {
  const normalizedRoute = normalizeHashRoute(route);
  const resolvedRoute = routeAliases[normalizedRoute] ?? normalizedRoute;

  return allowlist.some((entry) =>
    matchesRoutePattern(resolvedRoute, normalizeHashRoute(entry))
  );
}

/**
 * Matches a concrete hash route against an allowlist pattern. Pattern
 * segments starting with ":" match any non-empty segment, so
 * "/reset/:user/:recoverycode" covers "/reset/alice/HTZXV...".
 */
export function matchesRoutePattern(route: string, pattern: string): boolean {
  if (route === pattern) {
    return true;
  }

  const routeSegments = route.split("/");
  const patternSegments = pattern.split("/");

  if (routeSegments.length !== patternSegments.length) {
    return false;
  }

  return patternSegments.every((patternSegment, index) => {
    const routeSegment = routeSegments[index] ?? "";

    if (patternSegment.startsWith(":")) {
      return routeSegment.length > 0;
    }

    return patternSegment === routeSegment;
  });
}

export function MigratedRoutes() {
  return (
    <Routes>
      {/* The empty hash is ui-router's `initial_login` state. */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/response" element={<ResponsePage />} />
      <Route path="/pinchange" element={<PinChangePage />} />
      <Route path="/offline" element={<OfflinePage />} />
      <Route path="/component/clienttype" element={<ClientTypePage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/recovery" element={<RecoveryPage />} />
      <Route path="/reset/:user/:recoverycode" element={<RecoveryResetPage />} />
      <Route path="/audit/log" element={<AuditLogPage />} />
      <Route path="/user/list" element={<UserListPage />} />
      <Route path="/user/details/:realm/:user" element={<UserDetailsPage />} />
      <Route path="/user/add" element={<UserAddPage />} />
      <Route path="/user/password" element={<UserPasswordPage />} />
      <Route path="/machine/list" element={<MachineListPage />} />
      <Route path="/machine/details/:id/:resolver" element={<MachineDetailsPage />} />
      <Route path="/token/list" element={<TokenListPage />} />
      <Route path="/token/assign" element={<TokenAssignPage />} />
      <Route path="/token/getserial" element={<TokenGetSerialPage />} />
      <Route path="/token/challenges" element={<TokenChallengesPage />} />
      <Route path="/token/details/:serial" element={<TokenDetailsPage />} />
      <Route path="/token/lost/:serial" element={<TokenLostPage />} />
      <Route
        path="/token/applications/:application"
        element={<TokenApplicationsPage />}
      />
      <Route path="/token/import" element={<TokenImportPage />} />
      {/* ui-router addresses the parameterless state as `/token/enroll//`. */}
      <Route path="/token/enroll/*" element={<EnrollTokenPage mode="enroll" />} />
      <Route
        path="/token/rollover/:tokenType/:tokenSerial"
        element={<EnrollTokenPage mode="rollover" />}
      />
      <Route path="/token/wizard" element={<EnrollTokenPage mode="wizard" />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      {/* Unreachable: the shell only mounts for routes listed above. */}
      <Route path="*" element={null} />
    </Routes>
  );
}
