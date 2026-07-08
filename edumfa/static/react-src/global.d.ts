export interface LegacyEduMfaUser {
  username?: string;
  realm?: string;
  auth_token?: string;
  role?: string;
  rights?: string[];
  menus?: string[];
}

export interface LegacyEduMfaAuthBridge {
  getAuthToken: () => string | undefined;
  getRealm: () => string | undefined;
  getRole: () => string | undefined;
  getUser: () => LegacyEduMfaUser;
}

declare global {
  interface Window {
    browserLanguage?: string;
    eduMfaLegacyAuth?: LegacyEduMfaAuthBridge;
  }
}

export {};
