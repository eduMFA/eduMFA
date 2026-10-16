import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RecoveryResetPage } from "./RecoveryResetPage";
import { getFetchUrl, getJsonRequestBody } from "../../tests/fetchMockUtils";
import { renderWithProviders } from "../../tests/renderWithProviders";

describe("RecoveryResetPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resets the password with the recovery code from the route", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockResolvedValue(createEnvelopeResponse(true));
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    renderResetPage("/reset/alice/HTZXVABC");

    await user.type(screen.getByPlaceholderText("Type a password"), "newsecret");
    await user.type(screen.getByPlaceholderText("Repeat password"), "newsecret");

    const submitButton = screen.getByRole("button", { name: "Reset Password" });
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
    await user.click(submitButton);

    await screen.findByText("Your password has been reset successfully.");
    expect(screen.getByRole("link", { name: "Proceed to login" })).toHaveAttribute(
      "href",
      "#!/login"
    );

    const firstCall = fetchMock.mock.calls.at(0);
    expect(firstCall).toBeDefined();

    if (!firstCall) {
      throw new Error("Expected fetch to be called.");
    }

    const [url, request] = firstCall;
    expect(getFetchUrl(url)).toContain("/recover/reset");

    const body = getJsonRequestBody(request);
    expect(body).toEqual({
      password: "newsecret",
      recoverycode: "HTZXVABC",
      user: "alice"
    });
  });

  it("shows the failure message when the reset is rejected", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockResolvedValue(createEnvelopeResponse(false));
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    renderResetPage("/reset/alice/WRONGCODE");

    await user.type(screen.getByPlaceholderText("Type a password"), "newsecret");
    await user.type(screen.getByPlaceholderText("Repeat password"), "newsecret");

    const submitButton = screen.getByRole("button", { name: "Reset Password" });
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
    await user.click(submitButton);

    await screen.findByText("Failed to reset your password.");
  });
});

function renderResetPage(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/reset/:user/:recoverycode" element={<RecoveryResetPage />} />
    </Routes>,
    { route }
  );
}

function createEnvelopeResponse(value: boolean): Response {
  return new Response(
    JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      result: { status: true, value },
      version: "eduMFA"
    }),
    { status: 200 }
  );
}
