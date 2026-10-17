import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { resetLoginFlow, setPendingPinChange } from "./loginFlowStore";
import { PinChangePage } from "./PinChangePage";
import { popFlash } from "@/lib/flash";
import {
  createLegacyAuthBridge,
  createRouteFetchMock,
  findFetchCalls,
  getJsonRequestBody
} from "@/tests/fetchMockUtils";
import { renderWithProviders } from "@/tests/renderWithProviders";

function renderPinChange() {
  return renderWithProviders(
    <Routes>
      <Route path="/pinchange" element={<PinChangePage />} />
      <Route path="/login" element={<div>login page</div>} />
    </Routes>,
    { route: "/pinchange" }
  );
}

describe("PinChangePage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetLoginFlow();
    popFlash();
  });

  it("sets the new PIN and logs out", async () => {
    const bridge = {
      ...createLegacyAuthBridge({
        auth_token: "jwt-1",
        realm: "realm1",
        role: "user",
        username: "alice"
      }),
      logout: vi.fn()
    };
    vi.stubGlobal("eduMfaLegacyAuth", bridge);
    const fetchMock = createRouteFetchMock([
      { method: "POST", path: "/token/setpin/HOTP0001", respond: () => 1 }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    setPendingPinChange({ nextPinChange: null, serial: "HOTP0001" });
    const user = userEvent.setup();

    renderPinChange();

    expect(screen.getByText(/new PIN for token HOTP0001/)).toBeInTheDocument();
    const submitButton = screen.getByRole("button", { name: "Change PIN" });

    await user.type(screen.getByLabelText("New PIN"), "1234");
    await user.type(screen.getByLabelText("Repeat new PIN"), "1235");
    expect(submitButton).toBeDisabled();
    expect(screen.getByText("The PINs do not match.")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Repeat new PIN"));
    await user.type(screen.getByLabelText("Repeat new PIN"), "1234");
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    await screen.findByText("login page");
    const [setPinCall] = findFetchCalls(fetchMock, "POST", "/token/setpin/HOTP0001");
    expect(setPinCall && getJsonRequestBody(setPinCall.init)).toEqual({
      otppin: "1234"
    });
    await waitFor(() => {
      expect(bridge.logout).toHaveBeenCalledTimes(1);
    });
    expect(popFlash()).toEqual({
      message: "PIN changed successfully.",
      type: "success"
    });
  });

  it("explains when no PIN change is pending", () => {
    renderPinChange();

    expect(screen.getByRole("alert")).toHaveTextContent("No PIN change is pending.");
  });
});
