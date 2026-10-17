import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type PropsWithChildren
} from "react";

import { buildSession, type AuthSession, type SessionPayload } from "./session";
import { clearSession, lockSession, setSession, useSessionState } from "./sessionStore";
import { hashHref } from "@/lib/hashbang";

export {
  buildSession,
  defaultPolicyTemplateUrl,
  defaultWebUiSettings,
  emptySession,
  normalizeWebUiSettings
} from "./session";
export type {
  AuthSession,
  AuthUser,
  AuthenticatorAppImages,
  SessionPayload,
  WebUiSettings,
  WebUiSettingsPayload
} from "./session";

/** The envelope fields the session is built from (`POST /auth`). */
export interface LoginEnvelope {
  result: { value: SessionPayload };
  versionnumber?: string;
}

export interface AuthContextValue extends AuthSession {
  /** Forgets the session without the logout side effects (authentication errors). */
  dropSession: () => void;
  isAuthenticated: boolean;
  /** The idle lock is active; the lock dialog asks for the password. */
  isLocked: boolean;
  /** Port of `lock_screen`: destroys the token and opens the lock dialog. */
  lock: () => void;
  /** Stores the session of a successful `POST /auth` and ends a lock. */
  login: (envelope: LoginEnvelope) => void;
  /**
   * Port of the legacy `logout`: drops the session, returns to the login
   * page and follows the `logout_redirect_url` policy.
   */
  logout: () => void;
  setSession: (session: AuthSession) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const { locked, session } = useSessionState();

  const login = useCallback((envelope: LoginEnvelope) => {
    setSession(buildSession(envelope.result.value, envelope.versionnumber ?? null));
  }, []);

  const logout = useCallback(() => {
    const redirectUrl = session.settings.logoutRedirectUrl;

    clearSession();
    window.location.hash = hashHref("/login");
    window.scrollTo(0, 0);

    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }, [session.settings.logoutRedirectUrl]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...session,
      dropSession: clearSession,
      isAuthenticated: Boolean(session.authToken),
      isLocked: locked,
      lock: lockSession,
      login,
      logout,
      setSession
    }),
    [locked, login, logout, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return value;
}
