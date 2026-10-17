import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserPasswordPage } from "./UserPasswordPage";
import {
  createRouteFetchMock,
  findFetchCalls,
  getJsonRequestBody,
  stubLegacySession
} from "@/tests/fetchMockUtils";
import { renderWithProviders } from "@/tests/renderWithProviders";

const self = {
  description: "",
  editable: true,
  email: "alice@example.com",
  givenname: "Alice",
  mobile: "",
  phone: "",
  resolver: "sqlres",
  surname: "Cooper",
  userid: "1001",
  username: "alice"
};

describe("UserPasswordPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the own details and sets a password once both inputs match", async () => {
    stubLegacySession({
      auth_token: "legacy-token",
      menus: [],
      realm: "realm1",
      rights: ["userlist", "updateuser"],
      role: "user",
      username: "alice"
    });
    const fetchMock = createRouteFetchMock([
      { path: "/user/", respond: () => [self] },
      { method: "PUT", path: "/user/", respond: () => true }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithProviders(<UserPasswordPage />, { route: "/user/password" });

    await screen.findByText("Cooper");
    expect(screen.getByRole("link", { name: "alice@example.com" })).toHaveAttribute(
      "href",
      "mailto:alice@example.com"
    );

    const submitButton = screen.getByRole("button", { name: "set password" });
    await user.type(screen.getByLabelText("Password"), "newpass");
    await user.type(screen.getByLabelText("Repeat password"), "other");

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    await user.clear(screen.getByLabelText("Repeat password"));
    await user.type(screen.getByLabelText("Repeat password"), "newpass");

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    await user.click(submitButton);

    await screen.findByText("Password set successfully.");

    const [updateCall] = findFetchCalls(fetchMock, "PUT", "/user/");
    expect(getJsonRequestBody(updateCall?.init)).toEqual({
      password: "newpass",
      resolver: "sqlres",
      user: "alice",
      username: "alice"
    });
  });

  it("hides the password form when the user store is read-only", async () => {
    stubLegacySession({
      auth_token: "legacy-token",
      menus: [],
      realm: "realm1",
      rights: ["userlist", "updateuser"],
      role: "user",
      username: "alice"
    });
    vi.stubGlobal(
      "fetch",
      createRouteFetchMock([
        { path: "/user/", respond: () => [{ ...self, editable: false }] }
      ])
    );

    renderWithProviders(<UserPasswordPage />, { route: "/user/password" });

    await screen.findByText("Cooper");
    expect(
      screen.queryByRole("button", { name: "set password" })
    ).not.toBeInTheDocument();
  });
});
