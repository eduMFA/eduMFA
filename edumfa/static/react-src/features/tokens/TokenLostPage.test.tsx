import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";

import { TokenLostPage } from "./TokenLostPage";
import {
  createRouteFetchMock,
  findFetchCalls,
  stubLegacySession
} from "@/tests/fetchMockUtils";
import { renderWithProviders } from "@/tests/renderWithProviders";

describe("TokenLostPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("marks the token as lost and shows the one-time password", async () => {
    stubLegacySession({
      auth_token: "legacy-token",
      menus: [],
      realm: "",
      rights: ["tokenlist", "losttoken"],
      role: "admin",
      username: "admin"
    });
    const fetchMock = createRouteFetchMock([
      {
        method: "POST",
        path: "/token/lost/HOTP0001",
        respond: () => ({
          end_date: "2026-11-16T10:00+0100",
          init: true,
          password: "s3cr3tPassw0rd",
          serial: "lostHOTP0001"
        })
      }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route path="/token/lost/:serial" element={<TokenLostPage />} />
      </Routes>,
      { route: "/token/lost/HOTP0001" }
    );

    expect(screen.getByRole("link", { name: "HOTP0001" })).toHaveAttribute(
      "href",
      "#!/token/details/HOTP0001"
    );

    await user.click(screen.getByRole("button", { name: "Mark the token as lost" }));

    expect(await screen.findByText("s3cr3tPassw0rd")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "lostHOTP0001" })).toHaveAttribute(
      "href",
      "#!/token/details/lostHOTP0001"
    );
    expect(
      screen.getByText("The token is valid till 2026-11-16T10:00+0100.")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mark the token as lost" })
    ).not.toBeInTheDocument();
    expect(findFetchCalls(fetchMock, "POST", "/token/lost/HOTP0001")).toHaveLength(1);
  });
});
