import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AuthProvider,
  defaultWebUiSettings,
  normalizeWebUiSettings,
  useAuth
} from "./AuthProvider";
import { stubLegacySession } from "@/tests/fetchMockUtils";

describe("normalizeWebUiSettings", () => {
  it("falls back to the backend defaults", () => {
    expect(normalizeWebUiSettings(undefined)).toEqual(defaultWebUiSettings);
    expect(normalizeWebUiSettings({ token_page_size: 0, user_page_size: -3 })).toEqual(
      defaultWebUiSettings
    );
  });

  it("reads the WebUI policy values delivered by the bridge", () => {
    expect(
      normalizeWebUiSettings({
        audit_page_size: 50,
        search_on_enter: true,
        token_page_size: 100,
        user_details: true
      })
    ).toEqual({
      ...defaultWebUiSettings,
      auditPageSize: 50,
      searchOnEnter: true,
      tokenPageSize: 100,
      userDetailsInTokenList: true
    });
    expect(
      normalizeWebUiSettings({
        hide_buttons: true,
        token_rollover: { hotp: {}, totp: {} }
      })
    ).toMatchObject({ hideButtons: true, tokenRollover: ["hotp", "totp"] });
  });

  it("reads the enrollment settings", () => {
    expect(
      normalizeWebUiSettings({
        default_tokentype: "totp",
        indexedsecret_force_attribute: 1,
        indexedsecret_preset_attribute: "mobile",
        qr_image_android: "data:image/png;base64,QUJD",
        qr_image_ios: null,
        require_description: ["hotp", "sms"],
        show_seed: true,
        token_wizard: true
      })
    ).toMatchObject({
      authenticatorAppImages: {
        android: "data:image/png;base64,QUJD",
        custom: null,
        ios: null
      },
      defaultTokenType: "totp",
      indexedSecretForceAttribute: true,
      indexedSecretPresetAttribute: "mobile",
      requireDescription: ["hotp", "sms"],
      showSeed: true,
      tokenWizard: true
    });
  });
});

describe("AuthProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exposes the session and settings of the store", () => {
    stubLegacySession(
      {
        auth_token: "legacy-token",
        rights: ["tokenlist"],
        role: "admin",
        username: "admin"
      },
      { token_page_size: 30 }
    );

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.username).toBe("admin");
    expect(result.current.rights).toEqual(["tokenlist"]);
    expect(result.current.settings.tokenPageSize).toBe(30);
    expect(result.current.settings.auditPageSize).toBe(10);
  });

  it("starts without a session", () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLocked).toBe(false);
    expect(result.current.settings).toEqual(defaultWebUiSettings);
  });

  it("stores a login, locks and logs out", () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    act(() => {
      result.current.login({
        result: {
          value: {
            logout_time: 300,
            realm: "realm1",
            rights: ["tokenlist"],
            role: "user",
            timeout_action: "logout",
            token: "jwt-1",
            username: "alice"
          }
        },
        versionnumber: "2.10"
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.versionNumber).toBe("2.10");
    expect(result.current.settings.logoutTime).toBe(300);
    expect(result.current.settings.timeoutAction).toBe("logout");

    act(() => {
      result.current.lock();
    });

    expect(result.current.isLocked).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user?.username).toBe("alice");

    act(() => {
      result.current.logout();
    });

    expect(result.current.isLocked).toBe(false);
    expect(result.current.user).toBeNull();
    expect(window.location.hash).toBe("#!/login");
  });
});
