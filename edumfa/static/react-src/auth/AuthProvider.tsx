import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";

import type { LegacyEduMfaUser, LegacyWebUiSettings } from "@/global";

export interface AuthUser {
  realm: string;
  role: string;
  username: string;
}

/**
 * WebUI policy values delivered with the legacy login response and handed
 * over through the auth bridge. The defaults mirror the backend
 * (`DEFAULT_PAGE_SIZE` and `DEFAULT_AUDIT_PAGE_SIZE` in `api/lib/postpolicy.py`).
 */
export interface WebUiSettings {
  auditPageSize: number;
  /** QR codes linking to the authenticator app stores (data URLs), per policy. */
  authenticatorAppImages: AuthenticatorAppImages;
  /** `default_tokentype`: token type preselected on the enrollment page. */
  defaultTokenType: string;
  /** `hide_buttons`: hide action buttons the session has no right for. */
  hideButtons: boolean;
  /** `indexedsecret_force_attribute`: the indexed secret comes from a user attribute. */
  indexedSecretForceAttribute: boolean;
  /** `indexedsecret_preset_attribute`: user attribute that pre-fills the indexed secret. */
  indexedSecretPresetAttribute: string;
  /** `require_description`: token types that need a description on enrollment. */
  requireDescription: string[];
  /** `search_on_enter`: table filters only query the backend on Enter. */
  searchOnEnter: boolean;
  /** `show_seed`: show the OTP seed next to the enrollment QR code. */
  showSeed: boolean;
  tokenPageSize: number;
  /** `token_rollover`: token types whose software tokens offer a rollover. */
  tokenRollover: string[];
  /** `token_wizard`: users without a token land in the wizard, which hides the navigation. */
  tokenWizard: boolean;
  /** `token_wizard_2nd`: offer the enrollment wizard to users who own a token. */
  tokenWizard2nd: boolean;
  /** `user_details`: show the user id and resolver columns in the token list. */
  userDetailsInTokenList: boolean;
  userPageSize: number;
}

export interface AuthenticatorAppImages {
  android: string | null;
  custom: string | null;
  ios: string | null;
}

export const defaultWebUiSettings: WebUiSettings = {
  auditPageSize: 10,
  authenticatorAppImages: { android: null, custom: null, ios: null },
  defaultTokenType: "hotp",
  hideButtons: false,
  indexedSecretForceAttribute: false,
  indexedSecretPresetAttribute: "",
  requireDescription: [],
  searchOnEnter: false,
  showSeed: false,
  tokenPageSize: 15,
  tokenRollover: [],
  tokenWizard: false,
  tokenWizard2nd: false,
  userDetailsInTokenList: false,
  userPageSize: 15
};

export interface AuthSession {
  authToken: string | null;
  menus: string[];
  rights: string[];
  settings: WebUiSettings;
  user: AuthUser | null;
}

export interface AuthContextValue extends AuthSession {
  dropSession: () => void;
  isAuthenticated: boolean;
  /** Ends the session through the Angular logout (redirect policy, idle timer). */
  logout: () => void;
  setSession: (session: AuthSession) => void;
}

const emptySession: AuthSession = {
  authToken: null,
  menus: [],
  rights: [],
  settings: defaultWebUiSettings,
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

  const logout = useCallback(() => {
    const bridge = window.eduMfaLegacyAuth;

    if (bridge?.logout) {
      bridge.logout();
    } else {
      setSessionState(emptySession);
    }
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
      logout,
      setSession
    }),
    [dropSession, logout, session, setSession]
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
  const bridge = window.eduMfaLegacyAuth;
  const legacyUser = bridge?.getUser();

  if (!legacyUser?.auth_token) {
    return emptySession;
  }

  return normalizeLegacyUser(legacyUser, bridge?.getSettings?.());
}

function normalizeLegacyUser(
  legacyUser: LegacyEduMfaUser,
  legacySettings: LegacyWebUiSettings | undefined
): AuthSession {
  const username = legacyUser.username ?? "";
  const realm = legacyUser.realm ?? "";
  const role = legacyUser.role ?? "";

  return {
    authToken: legacyUser.auth_token ?? null,
    menus: Array.isArray(legacyUser.menus) ? legacyUser.menus : [],
    rights: Array.isArray(legacyUser.rights) ? legacyUser.rights : [],
    settings: normalizeWebUiSettings(legacySettings),
    user: username
      ? {
          realm,
          role,
          username
        }
      : null
  };
}

export function normalizeWebUiSettings(
  legacySettings: LegacyWebUiSettings | undefined
): WebUiSettings {
  return {
    auditPageSize: toPageSize(
      legacySettings?.audit_page_size,
      defaultWebUiSettings.auditPageSize
    ),
    authenticatorAppImages: {
      android: toImageUrl(legacySettings?.qr_image_android),
      custom: toImageUrl(legacySettings?.qr_image_custom),
      ios: toImageUrl(legacySettings?.qr_image_ios)
    },
    defaultTokenType:
      toFirstString(legacySettings?.default_tokentype) ||
      defaultWebUiSettings.defaultTokenType,
    hideButtons: legacySettings?.hide_buttons === true,
    indexedSecretForceAttribute: [true, 1, "1"].includes(
      legacySettings?.indexedsecret_force_attribute as never
    ),
    indexedSecretPresetAttribute: toFirstString(
      legacySettings?.indexedsecret_preset_attribute
    ),
    requireDescription: toTokenTypeList(legacySettings?.require_description),
    searchOnEnter: legacySettings?.search_on_enter === true,
    showSeed: legacySettings?.show_seed === true,
    tokenPageSize: toPageSize(
      legacySettings?.token_page_size,
      defaultWebUiSettings.tokenPageSize
    ),
    tokenRollover: toTokenTypeList(legacySettings?.token_rollover),
    tokenWizard: legacySettings?.token_wizard === true,
    tokenWizard2nd: legacySettings?.token_wizard_2nd === true,
    userDetailsInTokenList: legacySettings?.user_details === true,
    userPageSize: toPageSize(
      legacySettings?.user_page_size,
      defaultWebUiSettings.userPageSize
    )
  };
}

/** The policy delivers a dict keyed by token type; older bridges may send a list. */
function toTokenTypeList(
  value: Record<string, unknown> | string[] | undefined
): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }

  return value ? Object.keys(value) : [];
}

/** Policies with a single value arrive as a string, older bridges may send a list. */
function toFirstString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const first: unknown = value[0];

    return typeof first === "string" ? first : "";
  }

  return "";
}

function toImageUrl(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function toPageSize(value: unknown, fallback: number): number {
  const pageSize = Number(value);

  return Number.isInteger(pageSize) && pageSize > 0 ? pageSize : fallback;
}
