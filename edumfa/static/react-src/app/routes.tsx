import { Navigate, Route, Routes } from "react-router-dom";

import { ConfigRoutes } from "./ConfigRoutes";
import { AuditLogPage } from "@/features/audit/AuditLogPage";
import { ClientTypePage } from "@/features/components/ClientTypePage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { LoginPage } from "@/features/login/LoginPage";
import { OfflinePage } from "@/features/login/OfflinePage";
import { PinChangePage } from "@/features/login/PinChangePage";
import { ResponsePage } from "@/features/login/ResponsePage";
import { MachineDetailsPage } from "@/features/machines/MachineDetailsPage";
import { MachineListPage } from "@/features/machines/MachineListPage";
import { RecoveryPage } from "@/features/recovery/RecoveryPage";
import { RecoveryResetPage } from "@/features/recovery/RecoveryResetPage";
import { RegisterPage } from "@/features/register/RegisterPage";
import { RequireSession } from "@/features/shell/RequireSession";
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

/**
 * The hash routes of the application. The paths are the ones ui-router
 * used, so bookmarks and the documentation keep working; the parent states
 * that only redirected (`/token`, `/config`, ...) are redirects here too.
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* ui-router's `initial_login` state had the empty URL. */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/response" element={<ResponsePage />} />
      <Route path="/offline" element={<OfflinePage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/recovery" element={<RecoveryPage />} />
      <Route path="/reset/:user/:recoverycode" element={<RecoveryResetPage />} />
      <Route element={<RequireSession />}>
        <Route path="/pinchange" element={<PinChangePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/component"
          element={<Navigate replace to="/component/clienttype" />}
        />
        <Route path="/component/clienttype" element={<ClientTypePage />} />
        <Route path="/audit" element={<Navigate replace to="/audit/log" />} />
        <Route path="/audit/log" element={<AuditLogPage />} />
        <Route path="/user" element={<Navigate replace to="/user/list" />} />
        <Route path="/user/list" element={<UserListPage />} />
        <Route path="/user/details/:realm/:user" element={<UserDetailsPage />} />
        <Route path="/user/add" element={<UserAddPage />} />
        <Route path="/user/password" element={<UserPasswordPage />} />
        <Route path="/machine" element={<Navigate replace to="/machine/list" />} />
        <Route path="/machine/list" element={<MachineListPage />} />
        <Route path="/machine/details/:id/:resolver" element={<MachineDetailsPage />} />
        <Route path="/token" element={<Navigate replace to="/token/list" />} />
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
        {/* ui-router addressed the parameterless state as `/token/enroll//`. */}
        <Route path="/token/enroll/*" element={<EnrollTokenPage mode="enroll" />} />
        <Route
          path="/token/rollover/:tokenType/:tokenSerial"
          element={<EnrollTokenPage mode="rollover" />}
        />
        <Route path="/token/wizard" element={<EnrollTokenPage mode="wizard" />} />
        <Route path="/config" element={<Navigate replace to="/config/system/edit" />} />
        <Route path="/config/*" element={<ConfigRoutes />} />
      </Route>
      {/* `$urlRouterProvider.otherwise("/token/list")` */}
      <Route path="*" element={<Navigate replace to="/token/list" />} />
    </Routes>
  );
}
