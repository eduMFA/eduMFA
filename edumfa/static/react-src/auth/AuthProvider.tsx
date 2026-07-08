import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";

import type { LegacyEduMfaUser } from "../global";

export interface AuthUser {
  realm: string;
  role: string;
  username: string;
}

export interface AuthSession {
  authToken: string | null;
  menus: string[];
  rights: string[];
  user: AuthUser | null;
}

export interface AuthContextValue extends AuthSession {
  dropSession: () => void;
  isAuthenticated: boolean;
  setSession: (session: AuthSession) => void;
}

const emptySession: AuthSession = {
  authToken: null,
  menus: [],
  rights: [],
  user: null
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSessionState] = useState<AuthSession>(() => readLegacySession());

  const dropSession = useCallback(() => {
    setSessionState(emptySession);
  }, []);

  const setSession = useCallback((nextSession: AuthSession) => {
    setSessionState(nextSession);
  }, []);

  useEffect(() => {
    const syncLegacySession = () => {
      setSessionState(readLegacySession());
    };

    window.addEventListener("eduMfa:auth-changed", syncLegacySession);
    syncLegacySession();

    return () => {
      window.removeEventListener("eduMfa:auth-changed", syncLegacySession);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...session,
      dropSession,
      isAuthenticated: Boolean(session.authToken),
      setSession
    }),
    [dropSession, session, setSession]
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

function readLegacySession(): AuthSession {
  const legacyUser = window.eduMfaLegacyAuth?.getUser();

  if (!legacyUser?.auth_token) {
    return emptySession;
  }

  return normalizeLegacyUser(legacyUser);
}

function normalizeLegacyUser(legacyUser: LegacyEduMfaUser): AuthSession {
  const username = legacyUser.username ?? "";
  const realm = legacyUser.realm ?? "";
  const role = legacyUser.role ?? "";

  return {
    authToken: legacyUser.auth_token ?? null,
    menus: Array.isArray(legacyUser.menus) ? legacyUser.menus : [],
    rights: Array.isArray(legacyUser.rights) ? legacyUser.rights : [],
    user: username
      ? {
          realm,
          role,
          username
        }
      : null
  };
}
