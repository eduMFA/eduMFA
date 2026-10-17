import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";

/**
 * Layout route for everything behind the login. The legacy app only found
 * out through a 401 that the session was gone; here the route itself sends
 * the browser to the login page. A locked session keeps the page mounted
 * behind the lock dialog.
 */
export function RequireSession() {
  const { isAuthenticated, isLocked } = useAuth();

  if (!isAuthenticated && !isLocked) {
    return <Navigate replace to="/login" />;
  }

  return <Outlet />;
}
