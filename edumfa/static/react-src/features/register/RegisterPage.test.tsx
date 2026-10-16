import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RegisterPage } from "./RegisterPage";
import { getFetchUrl, getJsonRequestBody } from "../../tests/fetchMockUtils";
import { renderWithProviders } from "../../tests/renderWithProviders";

describe("RegisterPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("submits the registration form and shows the success message", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          result: { status: true, value: true },
          version: "eduMFA"
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    const submitButton = screen.getByRole("button", { name: "Register" });
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText("Username"), "alice");
    await user.type(screen.getByLabelText("Surname"), "Cooper");
    await user.type(screen.getByLabelText("Given name"), "Alice");
    await user.type(screen.getByLabelText("Email"), "alice@example.com");

    const [passwordInput, repeatInput] = getPasswordInputs();
    await user.type(passwordInput, "secret123");
    await user.type(repeatInput, "secret123");

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    await user.click(submitButton);

    await screen.findByText("User account created. An Email has been sent to you.");

    const registerCall = fetchMock.mock.calls.find(([url]) =>
      getFetchUrl(url).includes("/register")
    );
    expect(registerCall).toBeDefined();

    if (!registerCall) {
      throw new Error("Expected the register endpoint to be called.");
    }

    const [, request] = registerCall;
    expect(request?.method).toBe("POST");

    const body = getJsonRequestBody(request);
    expect(body).toMatchObject({
      email: "alice@example.com",
      givenname: "Alice",
      password: "secret123",
      surname: "Cooper",
      username: "alice"
    });
    expect(body).not.toHaveProperty("password2");
  });

  it("keeps the submit button disabled while passwords do not match", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText("Username"), "alice");
    await user.type(screen.getByLabelText("Surname"), "Cooper");
    await user.type(screen.getByLabelText("Given name"), "Alice");
    await user.type(screen.getByLabelText("Email"), "alice@example.com");

    const [passwordInput, repeatInput] = getPasswordInputs();
    await user.type(passwordInput, "secret123");
    await user.type(repeatInput, "different");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Register" })).toBeDisabled();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

function getPasswordInputs(): [HTMLElement, HTMLElement] {
  const passwordInputs = screen.getAllByPlaceholderText("Password");
  const passwordInput = passwordInputs.at(0);
  const repeatInput = passwordInputs.at(1);

  if (!passwordInput || !repeatInput) {
    throw new Error("Expected both password inputs to be rendered.");
  }

  return [passwordInput, repeatInput];
}
