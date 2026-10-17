import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SystemConfigPage } from "./SystemConfigPage";
import {
  createRouteFetchMock,
  findFetchCalls,
  getJsonRequestBody,
  stubLegacySession
} from "@/tests/fetchMockUtils";
import { renderWithProviders } from "@/tests/renderWithProviders";

const systemConfig = {
  AutoResync: "True",
  AutoResyncTimeout: "200",
  DefaultOtpLen: "8",
  PrependPin: "False",
  ReturnSamlAttributes: "False",
  failcounter_clear_timeout: "15",
  "recovery.identifier": "mail1",
  splitAtSign: "True",
  "totp.hashlib": "sha256"
};

describe("SystemConfigPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the loaded configuration and the SMTP servers", async () => {
    stubAdminSession(["configread", "configwrite", "smtpserver_read"]);
    vi.stubGlobal("fetch", createBackendMock());

    renderPage();

    expect(
      await screen.findByLabelText("Use @ sign to split the username and the realm.")
    ).toBeChecked();
    expect(
      screen.getByLabelText(
        "Prepend the PIN in front of the OTP value. Otherwise it will be post pended."
      )
    ).not.toBeChecked();
    expect(screen.getByLabelText("Clear failcounter after minutes")).toHaveValue("15");
    expect(screen.getByLabelText("OTP length of newly enrolled tokens")).toHaveValue(
      "8"
    );
    expect(screen.getByLabelText("Auto resync timeout")).toBeEnabled();
    expect(
      screen.getByLabelText(
        "Include SAML attributes even if the user failed to authenticate."
      )
    ).toBeDisabled();

    const recoverySelect = screen.getByLabelText("SMTP server for password recovery");
    await waitFor(() => {
      expect(recoverySelect).toContainHTML("mail2");
    });
    expect(recoverySelect).toHaveValue("mail1");
    expect(
      screen.getByRole("link", { name: "SMTP server configuration" })
    ).toHaveAttribute("href", "#!/config/smtp/list");
  });

  it("posts the form entries with PrependPin.type on save", async () => {
    stubAdminSession(["configread", "configwrite", "smtpserver_read"]);
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPage();

    await user.click(
      await screen.findByLabelText(
        "Prepend the PIN in front of the OTP value. Otherwise it will be post pended."
      )
    );
    const otpLength = screen.getByLabelText("OTP length of newly enrolled tokens");
    await user.clear(otpLength);
    await user.type(otpLength, "6");
    await user.click(screen.getByLabelText("Automatic resync during authentication"));
    expect(screen.getByLabelText("Auto resync timeout")).toBeDisabled();
    await user.selectOptions(
      screen.getByLabelText("SMTP server for password recovery"),
      "mail2"
    );
    await user.click(screen.getByRole("button", { name: "Save System Config" }));

    await waitFor(() => {
      expect(findFetchCalls(fetchMock, "POST", "/system/setConfig")).toHaveLength(1);
    });
    const [saveCall] = findFetchCalls(fetchMock, "POST", "/system/setConfig");
    expect(getJsonRequestBody(saveCall?.init)).toEqual({
      AutoResync: false,
      AutoResyncTimeout: "200",
      DefaultChallengeValidityTime: "",
      DefaultCountWindow: "",
      DefaultMaxFailCount: "",
      DefaultOtpLen: "6",
      DefaultSyncWindow: "",
      DisableAutoChallengeJanitor: false,
      DisableClientTracking: false,
      IncFailCountOnFalsePin: false,
      OverrideAuthorizationClient: "",
      PrependPin: true,
      "PrependPin.type": "public",
      ReturnSamlAttributes: false,
      ReturnSamlAttributesOnFail: false,
      UserCacheExpiration: "",
      failcounter_clear_timeout: "15",
      no_auth_counter: false,
      "recovery.identifier": "mail2",
      splitAtSign: true
    });
    expect(await screen.findByText("System Config saved.")).toBeInTheDocument();
  });

  it("hides the save button and skips the SMTP lookup without the rights", async () => {
    stubAdminSession(["configread"]);
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);

    renderPage();

    expect(
      await screen.findByLabelText("Use @ sign to split the username and the realm.")
    ).toBeChecked();
    expect(
      screen.queryByRole("button", { name: "Save System Config" })
    ).not.toBeInTheDocument();
    expect(findFetchCalls(fetchMock, "GET", "/smtpserver/")).toHaveLength(0);
    // The stored identifier stays selectable even though the list is unknown.
    expect(screen.getByLabelText("SMTP server for password recovery")).toHaveValue(
      "mail1"
    );
  });

  it("asks for a login without a session", () => {
    vi.stubGlobal("fetch", createBackendMock());

    renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent("log in");
    expect(
      screen.queryByLabelText("Use @ sign to split the username and the realm.")
    ).not.toBeInTheDocument();
  });
});

function renderPage() {
  return renderWithProviders(<SystemConfigPage />, { route: "/config/system/edit" });
}

function stubAdminSession(rights: string[]): void {
  stubLegacySession({
    auth_token: "legacy-token",
    menus: [],
    realm: "",
    rights,
    role: "admin",
    username: "admin"
  });
}

function createBackendMock() {
  return createRouteFetchMock([
    { path: "/system/", respond: () => systemConfig },
    {
      path: "/smtpserver/",
      respond: () => ({
        mail1: { identifier: "mail1", server: "mail1.example.com" },
        mail2: { identifier: "mail2", server: "mail2.example.com" }
      })
    },
    {
      method: "POST",
      path: "/system/setConfig",
      respond: () => ({ splitAtSign: "update" })
    }
  ]);
}
