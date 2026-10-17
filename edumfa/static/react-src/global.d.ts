export interface LegacyEduMfaUser {
  username?: string;
  realm?: string;
  auth_token?: string;
  role?: string;
  rights?: string[];
  menus?: string[];
}

/**
 * WebUI policy values from the login response, keyed like the backend
 * delivers them (`api/lib/postpolicy.py`, `get_webui_settings`).
 */
export interface LegacyWebUiSettings {
  audit_page_size?: number;
  /** Token type preselected on the enrollment page. */
  default_tokentype?: string;
  hide_buttons?: boolean;
  /** `1` when a user policy forces the indexed secret from a user attribute. */
  indexedsecret_force_attribute?: boolean | number;
  /** User attribute that pre-fills the indexed secret. */
  indexedsecret_preset_attribute?: string | string[];
  /** QR codes (data URLs) linking to the authenticator apps; `null` when disabled. */
  qr_image_android?: string | null;
  qr_image_custom?: string | null;
  qr_image_ios?: string | null;
  /** Token types that need a description on enrollment. */
  require_description?: Record<string, unknown> | string[];
  search_on_enter?: boolean;
  /** Show the OTP seed next to the enrollment QR code. */
  show_seed?: boolean;
  token_page_size?: number;
  /** Token types that may be rolled over, keyed by type (policy action values). */
  token_rollover?: Record<string, unknown> | string[];
  /** Users without a token are sent to the enrollment wizard. */
  token_wizard?: boolean;
  token_wizard_2nd?: boolean;
  user_details?: boolean;
  user_page_size?: number;
}

export interface LegacyEduMfaAuthBridge {
  getAuthToken: () => string | undefined;
  getRealm: () => string | undefined;
  getRole: () => string | undefined;
  /** Missing on bridges built before the settings were exposed. */
  getSettings?: () => LegacyWebUiSettings | undefined;
  getUser: () => LegacyEduMfaUser;
  /**
   * Hands a successful `POST /auth` envelope to the Angular `do_login_stuff`,
   * which stores the session and opens the start page. Missing on bridges
   * built before the login page moved.
   */
  login?: (loginResponse: unknown) => void;
  /** Runs the Angular logout; missing on bridges built before the wizard moved. */
  logout?: () => void;
}

declare global {
  interface Window {
    browserLanguage?: string;
    eduMfaLegacyAuth?: LegacyEduMfaAuthBridge;
  }
}

export {};
