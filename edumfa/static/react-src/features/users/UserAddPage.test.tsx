import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";

import { UserAddPage } from "./UserAddPage";
import {
  createRouteFetchMock,
  findFetchCalls,
  getJsonRequestBody,
  stubLegacySession
} from "../../tests/fetchMockUtils";
import { fieldLabel } from "../../tests/labels";
import { renderWithProviders } from "../../tests/renderWithProviders";

const editableResolvers = {
  sqlres: {
    data: {
      Map: JSON.stringify({
        email: "email",
        givenname: "givenname",
        password: "password",
        surname: "surname",
        userid: "id",
        username: "username"
      })
    },
    editable: true,
    resolvername: "sqlres",
    type: "sqlresolver"
  }
};

describe("UserAddPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates the user in the selected editable resolver", async () => {
    stubLegacySession({
      auth_token: "legacy-token",
      menus: [],
      realm: "",
      rights: ["adduser"],
      role: "admin",
      username: "admin"
    });
    const fetchMock = createRouteFetchMock([
      { path: "/resolver/", respond: () => editableResolvers },
      { method: "POST", path: "/user/", respond: () => 1 }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route path="/user/add" element={<UserAddPage />} />
        <Route path="/user/list" element={<div>list page</div>} />
      </Routes>,
      { route: "/user/add" }
    );

    expect(await screen.findByLabelText(fieldLabel("Resolver"))).toHaveValue("sqlres");

    const [resolverCall] = findFetchCalls(fetchMock, "GET", "/resolver/");
    expect(resolverCall?.url.searchParams.get("editable")).toBe("1");

    const saveButton = screen.getByRole("button", { name: "Save user" });
    expect(saveButton).toBeDisabled();

    await user.type(screen.getByLabelText(fieldLabel("username")), "carol");
    await user.type(screen.getByLabelText(fieldLabel("email")), "carol@example.com");
    await user.type(screen.getByLabelText(fieldLabel("password")), "s3cret");

    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });

    await user.click(saveButton);

    await screen.findByText("list page");

    const [createCall] = findFetchCalls(fetchMock, "POST", "/user/");
    expect(getJsonRequestBody(createCall?.init)).toMatchObject({
      email: "carol@example.com",
      password: "s3cret",
      resolver: "sqlres",
      user: "carol",
      username: "carol"
    });
  });

  it("explains how to get an editable resolver when there is none", async () => {
    stubLegacySession({
      auth_token: "legacy-token",
      menus: [],
      realm: "",
      rights: ["adduser"],
      role: "admin",
      username: "admin"
    });
    vi.stubGlobal(
      "fetch",
      createRouteFetchMock([{ path: "/resolver/", respond: () => ({}) }])
    );

    renderWithProviders(<UserAddPage />, { route: "/user/add" });

    expect(
      await screen.findByRole("link", { name: "define an editable resolver" })
    ).toHaveAttribute("href", "#!/config/resolvers/list");
    expect(screen.queryByRole("button", { name: "Save user" })).not.toBeInTheDocument();
  });
});
