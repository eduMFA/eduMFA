import { Navigate, Route, Routes } from "react-router-dom";

import { normalizeHashRoute } from "./bootstrap";
import { ClientTypePage } from "../features/components/ClientTypePage";

export const migratedRoutePaths = ["/component/clienttype"] as const;

export type MigratedRoutePath = (typeof migratedRoutePaths)[number];

export function isRouteMigrated(route: string, allowlist: readonly string[]): boolean {
  const normalizedRoute = normalizeHashRoute(route);
  const normalizedAllowlist = allowlist.map((entry) => normalizeHashRoute(entry));

  return normalizedAllowlist.includes(normalizedRoute);
}

export function MigratedRoutes() {
  return (
    <Routes>
      <Route path="/component/clienttype" element={<ClientTypePage />} />
      <Route path="*" element={<Navigate to="/component/clienttype" replace />} />
    </Routes>
  );
}
