import type { U2fSignRequest } from "./u2f";
import type { WebAuthnSignRequest } from "./webauthn";

export interface AuthUser {
  realm: string;
  role: string;
  username: string;
}

export interface AuthenticatorAppImages {
  android: string | null;
  custom: string | null;
  ios: string | null;
}

/**
 * WebUI policy values of the login response, keyed like the backend delivers
 * them (`get_webui_settings` in `api/lib/postpolicy.py`).
 */
export interface WebUiSettingsPayload {
  admin_dashboard?: boolean;
  audit_page_size?: number;
  default_tokentype?: string;
  deletion_confirmation?: boolean;
  dialog_no_token?: boolean;
  hide_buttons?: boolean;
  hide_welcome?: boolean;
  indexedsecret_force_attribute?: boolean | number;
  indexedsecret_preset_attribute?: string | string[];
  logout_redirect_url?: string;
  logout_time?: number;
  policy_template_url?: string;
  qr_image_android?: string | null;
  qr_image_custom?: string | null;
  qr_image_ios?: string | null;
  require_description?: Record<string, unknown> | string[];
  search_on_enter?: boolean;
  show_node?: string;
  show_seed?: boolean;
  subscription_status?: number;
  subscription_status_push?: number;
  timeout_action?: string;
  token_page_size?: number;
  token_rollover?: Record<string, unknown> | string[];
  token_wizard?: boolean;
  token_wizard_2nd?: boolean;
  user_details?: boolean;
  user_page_size?: number;
}

/**
 * WebUI policy values of the session. The defaults mirror the backend
 * (`DEFAULT_PAGE_SIZE`, `DEFAULT_AUDIT_PAGE_SIZE`, `DEFAULT_LOGOUT_TIME`,
 * `DEFAULT_TIMEOUT_ACTION` in `api/lib/postpolicy.py`).
 */
export interface WebUiSettings {
  /** `admin_dashboard`: administrators start on the dashboard. */
  adminDashboard: boolean;
  auditPageSize: number;
  /** QR codes linking to the authenticator app stores (data URLs), per policy. */
  authenticatorAppImages: AuthenticatorAppImages;
  /** `default_tokentype`: token type preselected on the enrollment page. */
  defaultTokenType: string;
  /** `deletion_confirmation`: ask before deleting a configuration object. */
  deletionConfirmation: boolean;
  /** `dialog_no_token`: greet a user without tokens with the welcome dialog. */
  dialogNoToken: boolean;
  /** `hide_buttons`: hide action buttons the session has no right for. */
  hideButtons: boolean;
  /** `hide_welcome`: skip the administrator welcome dialog. */
  hideWelcome: boolean;
  /** `indexedsecret_force_attribute`: the indexed secret comes from a user attribute. */
  indexedSecretForceAttribute: boolean;
  /** `indexedsecret_preset_attribute`: user attribute that pre-fills the indexed secret. */
  indexedSecretPresetAttribute: string;
  /** `logout_redirect_url`: where the browser goes after a logout; empty stays on the login. */
  logoutRedirectUrl: string;
  /** `logout_time`: seconds of inactivity until the idle action. */
  logoutTime: number;
  /** `policy_template_url`: where the policy editor loads its templates from. */
  policyTemplateUrl: string;
  /** `require_description`: token types that need a description on enrollment. */
  requireDescription: string[];
  /** `search_on_enter`: table filters only query the backend on Enter. */
  searchOnEnter: boolean;
  /** `show_node`: node name shown in the navigation. */
  showNode: string;
  /** `show_seed`: show the OTP seed next to the enrollment QR code. */
  showSeed: boolean;
  subscriptionStatus: number;
  subscriptionStatusPush: number;
  /** `timeout_action`: "lockscreen" or "logout" after the idle time. */
  timeoutAction: "lockscreen" | "logout";
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

/** The legacy `PolicyTemplateFactory` default. */
export const defaultPolicyTemplateUrl =
  "https://raw.githubusercontent.com/eduMFA/policy-templates/main/templates/";

export const defaultWebUiSettings: WebUiSettings = {
  adminDashboard: false,
  auditPageSize: 10,
  authenticatorAppImages: { android: null, custom: null, ios: null },
  defaultTokenType: "hotp",
  deletionConfirmation: false,
  dialogNoToken: false,
  hideButtons: false,
  hideWelcome: false,
  indexedSecretForceAttribute: false,
  indexedSecretPresetAttribute: "",
  logoutRedirectUrl: "",
  logoutTime: 120,
  policyTemplateUrl: defaultPolicyTemplateUrl,
  requireDescription: [],
  searchOnEnter: false,
  showNode: "",
  showSeed: false,
  subscriptionStatus: 0,
  subscriptionStatusPush: 0,
  timeoutAction: "lockscreen",
  tokenPageSize: 15,
  tokenRollover: [],
  tokenWizard: false,
  tokenWizard2nd: false,
  userDetailsInTokenList: false,
  userPageSize: 15
};

export interface AuthSession {
  authToken: string | null;
  /** `log_level` of the backend; the shell warns about debug logging. */
  logLevel: number | null;
  menus: string[];
  rights: string[];
  settings: WebUiSettings;
  user: AuthUser | null;
  /** `versionnumber` of the login response, shown in the footer and used for docs links. */
  versionNumber: string | null;
}

export const emptySession: AuthSession = {
  authToken: null,
  logLevel: null,
  menus: [],
  rights: [],
  settings: defaultWebUiSettings,
  user: null,
  versionNumber: null
};

/** The session fields of a `POST /auth` value (`api/auth.ts` adds the rest). */
export interface SessionPayload extends WebUiSettingsPayload {
  log_level?: number;
  menus?: string[];
  realm: string;
  rights?: string[];
  role: string;
  token?: string;
  username: string;
}

/** Builds the session from a successful login response. */
export function buildSession(
  value: SessionPayload,
  versionNumber: string | null = null
): AuthSession {
  return {
    authToken: value.token ?? null,
    logLevel: typeof value.log_level === "number" ? value.log_level : null,
    menus: value.menus ?? [],
    rights: value.rights ?? [],
    settings: normalizeWebUiSettings(value),
    user: { realm: value.realm, role: value.role, username: value.username },
    versionNumber
  };
}

export function normalizeWebUiSettings(
  payload: WebUiSettingsPayload | undefined
): WebUiSettings {
  return {
    adminDashboard: payload?.admin_dashboard === true,
    auditPageSize: toPageSize(
      payload?.audit_page_size,
      defaultWebUiSettings.auditPageSize
    ),
    authenticatorAppImages: {
      android: toImageUrl(payload?.qr_image_android),
      custom: toImageUrl(payload?.qr_image_custom),
      ios: toImageUrl(payload?.qr_image_ios)
    },
    defaultTokenType:
      toFirstString(payload?.default_tokentype) ||
      defaultWebUiSettings.defaultTokenType,
    deletionConfirmation: payload?.deletion_confirmation === true,
    dialogNoToken: payload?.dialog_no_token === true,
    hideButtons: payload?.hide_buttons === true,
    hideWelcome: payload?.hide_welcome === true,
    indexedSecretForceAttribute: [true, 1, "1"].includes(
      payload?.indexedsecret_force_attribute as never
    ),
    indexedSecretPresetAttribute: toFirstString(
      payload?.indexedsecret_preset_attribute
    ),
    logoutRedirectUrl: toFirstString(payload?.logout_redirect_url),
    logoutTime: toPositiveInteger(
      payload?.logout_time,
      defaultWebUiSettings.logoutTime
    ),
    policyTemplateUrl:
      toFirstString(payload?.policy_template_url) || defaultPolicyTemplateUrl,
    requireDescription: toTokenTypeList(payload?.require_description),
    searchOnEnter: payload?.search_on_enter === true,
    showNode: toFirstString(payload?.show_node),
    showSeed: payload?.show_seed === true,
    subscriptionStatus: toInteger(payload?.subscription_status, 0),
    subscriptionStatusPush: toInteger(payload?.subscription_status_push, 0),
    timeoutAction: payload?.timeout_action === "logout" ? "logout" : "lockscreen",
    tokenPageSize: toPageSize(
      payload?.token_page_size,
      defaultWebUiSettings.tokenPageSize
    ),
    tokenRollover: toTokenTypeList(payload?.token_rollover),
    tokenWizard: payload?.token_wizard === true,
    tokenWizard2nd: payload?.token_wizard_2nd === true,
    userDetailsInTokenList: payload?.user_details === true,
    userPageSize: toPageSize(payload?.user_page_size, defaultWebUiSettings.userPageSize)
  };
}

/** The policy delivers a dict keyed by token type; a list is accepted as well. */
function toTokenTypeList(
  value: Record<string, unknown> | string[] | undefined
): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }

  return value ? Object.keys(value) : [];
}

/** Policies with a single value arrive as a string; a list is accepted as well. */
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
  return toPositiveInteger(value, fallback);
}

function toPositiveInteger(value: unknown, fallback: number): number {
  const number = Number(value);

  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function toInteger(value: unknown, fallback: number): number {
  const number = Number(value);

  return Number.isInteger(number) ? number : fallback;
}

/** A challenge-response login waiting for its second step. */
export interface PendingChallenge {
  /** Data URL of a QR code (TiQR, push); the last one when several tokens send one. */
  image: string | null;
  /** The challenge text (`detail.message`, the messages of all tokens joined). */
  message: string;
  /** At least one token is confirmed out of band (`client_mode: "poll"`). */
  polling: boolean;
  realm: string;
  /** Serials of the challenged tokens; the legacy view listed them when there was more than one. */
  serials: string[];
  /** At least one token expects a typed response (`client_mode: "interactive"`). */
  showInput: boolean;
  transactionId: string;
  u2fSignRequests: U2fSignRequest[];
  username: string;
  webAuthnSignRequests: WebAuthnSignRequest[];
}

/** `detail.pin_change` of a successful login: the token whose PIN expired. */
export interface PendingPinChange {
  nextPinChange: string | null;
  serial: string;
}
