import { Route, Routes } from "react-router-dom";

import { normalizeHashRoute } from "./bootstrap";
import { AuditLogPage } from "../features/audit/AuditLogPage";
import { ClientTypePage } from "../features/components/ClientTypePage";
import { RecoveryPage } from "../features/recovery/RecoveryPage";
import { RecoveryResetPage } from "../features/recovery/RecoveryResetPage";
import { RegisterPage } from "../features/register/RegisterPage";
import { MachineDetailsPage } from "../features/machines/MachineDetailsPage";
import { MachineListPage } from "../features/machines/MachineListPage";
import { UserAddPage } from "../features/users/UserAddPage";
import { UserDetailsPage } from "../features/users/UserDetailsPage";
import { UserListPage } from "../features/users/UserListPage";
import { UserPasswordPage } from "../features/users/UserPasswordPage";

export const migratedRoutePaths = [
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
  "/machine/details/:id/:resolver"
] as const;

export type MigratedRoutePath = (typeof migratedRoutePaths)[number];

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

  return allowlist.some((entry) =>
    matchesRoutePattern(normalizedRoute, normalizeHashRoute(entry))
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
      {/* Unreachable: the shell only mounts for routes listed above. */}
      <Route path="*" element={null} />
    </Routes>
  );
}
