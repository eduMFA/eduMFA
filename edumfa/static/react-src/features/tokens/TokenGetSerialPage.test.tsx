import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TokenGetSerialPage } from "./TokenGetSerialPage";
import {
  createRouteFetchMock,
  findFetchCalls,
  stubLegacySession
} from "@/tests/fetchMockUtils";
import { fieldLabel } from "@/tests/labels";
import { renderWithProviders } from "@/tests/renderWithProviders";

const lookupPath = "/token/getserial/755224";

describe("TokenGetSerialPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("counts the candidate tokens before running the search", async () => {
    stubAdminSession();
    const fetchMock = createRouteFetchMock([
      {
        path: lookupPath,
        respond: (url) =>
          url.searchParams.get("count") === "1"
            ? { count: 3, serial: null }
            : { count: 3, serial: "HOTP0001" }
      }
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithProviders(<TokenGetSerialPage />, { route: "/token/getserial" });

    expect(screen.getByRole("button", { name: "Get Serial Number" })).toBeDisabled();

    await user.type(screen.getByLabelText(fieldLabel("OTP Value")), "755224");
    await user.selectOptions(screen.getByLabelText("Assignment State"), "assigned");
    await user.type(screen.getByLabelText("Serial Substring"), "HOTP");
    await user.click(screen.getByRole("button", { name: "Get Serial Number" }));

    await screen.findByText(/Your search would include 3 tokens/);
    expect(screen.getByLabelText(fieldLabel("OTP Value"))).toBeDisabled();

    const [countCall] = findFetchCalls(fetchMock, "GET", lookupPath);
    expect(countCall?.url.searchParams.get("count")).toBe("1");
    expect(countCall?.url.searchParams.get("assigned")).toBe("1");
    expect(countCall?.url.searchParams.has("unassigned")).toBe(false);
    expect(countCall?.url.searchParams.get("serial")).toBe("HOTP");
    expect(countCall?.url.searchParams.has("type")).toBe(false);

    await user.click(screen.getByRole("button", { name: "Run search" }));

    expect(await screen.findByRole("link", { name: "HOTP0001" })).toHaveAttribute(
      "href",
      "#!/token/details/HOTP0001"
    );
    expect(findFetchCalls(fetchMock, "GET", lookupPath)).toHaveLength(2);
    expect(
      findFetchCalls(fetchMock, "GET", lookupPath).at(-1)?.url.searchParams.has("count")
    ).toBe(false);

    await user.click(screen.getByRole("button", { name: "OK" }));

    expect(screen.getByRole("button", { name: "Get Serial Number" })).toBeEnabled();
    expect(screen.queryByRole("link", { name: "HOTP0001" })).not.toBeInTheDocument();
  });

  it("reports when no token produced the OTP value", async () => {
    stubAdminSession();
    vi.stubGlobal(
      "fetch",
      createRouteFetchMock([
        { path: lookupPath, respond: () => ({ count: 1, serial: null }) }
      ])
    );
    const user = userEvent.setup();

    renderWithProviders(<TokenGetSerialPage />, { route: "/token/getserial" });

    await user.type(screen.getByLabelText(fieldLabel("OTP Value")), "755224");
    await user.click(screen.getByRole("button", { name: "Get Serial Number" }));
    await user.click(await screen.findByRole("button", { name: "Run search" }));

    await screen.findByText("No Serial number could be found for OTP value 755224.");
  });
});

function stubAdminSession(): void {
  stubLegacySession({
    auth_token: "legacy-token",
    menus: [],
    realm: "",
    rights: ["tokenlist", "getserial"],
    role: "admin",
    username: "admin"
  });
}
