import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";

import { TokenAssignPage } from "./TokenAssignPage";
import {
  createRouteFetchMock,
  findFetchCalls,
  getJsonRequestBody,
  stubLegacySession
} from "@/tests/fetchMockUtils";
import { fieldLabel } from "@/tests/labels";
import { renderWithProviders } from "@/tests/renderWithProviders";

describe("TokenAssignPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("assigns the token to the own account and returns to the list", async () => {
    stubUserSession();
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPage();

    expect(screen.getByRole("button", { name: "Assign Token" })).toBeDisabled();

    await user.type(
      screen.getByRole("combobox", { name: fieldLabel("Serial") }),
      "HOTP0002 (hotp) "
    );
    await user.type(screen.getByLabelText("PIN/Password"), "1234");
    await user.type(screen.getByLabelText("Repeat PIN or password"), "1234");
    await user.click(screen.getByRole("button", { name: "Assign Token" }));

    await screen.findByText("list page");

    const [assignCall] = findFetchCalls(fetchMock, "POST", "/token/assign");
    // The serial is stripped from the suggestion; no user is sent, the
    // backend assigns to the authenticated user.
    expect(getJsonRequestBody(assignCall?.init)).toEqual({
      pin: "1234",
      serial: "HOTP0002"
    });
  });

  it("keeps the form disabled while the PINs differ", async () => {
    stubUserSession();
    vi.stubGlobal("fetch", createBackendMock());
    const user = userEvent.setup();

    renderPage();

    await user.type(
      screen.getByRole("combobox", { name: fieldLabel("Serial") }),
      "HOTP0002"
    );
    await user.type(screen.getByLabelText("PIN/Password"), "1234");
    await user.type(screen.getByLabelText("Repeat PIN or password"), "12");

    expect(screen.getByText("The PINs do not match.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Assign Token" })).toBeDisabled();
  });
});

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/token/assign" element={<TokenAssignPage />} />
      <Route path="/token/list" element={<div>list page</div>} />
    </Routes>,
    { route: "/token/assign" }
  );
}

function stubUserSession(): void {
  stubLegacySession({
    auth_token: "legacy-token",
    menus: [],
    realm: "realm1",
    rights: ["assign", "enrollHOTP"],
    role: "user",
    username: "alice"
  });
}

function createBackendMock() {
  return createRouteFetchMock([
    {
      path: "/token/",
      respond: () => ({ count: 0, current: 1, next: null, prev: null, tokens: [] })
    },
    { method: "POST", path: "/token/assign", respond: () => true }
  ]);
}
