import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserListPage } from "./UserListPage";
import {
  createEnvelopeResponse,
  stubSession,
  getFetchUrl
} from "@/tests/fetchMockUtils";
import { renderWithProviders } from "@/tests/renderWithProviders";

const realms = {
  realm1: { default: true, id: 1, resolver: [] },
  realm2: { default: false, id: 2, resolver: [] }
};

const users = [
  {
    email: "alice@example.com",
    givenname: "Alice",
    mobile: "123",
    phone: "456",
    resolver: "resolver1",
    surname: "Cooper",
    userid: "1001",
    username: "alice"
  },
  {
    email: "bob@example.com",
    givenname: "Bob",
    mobile: "",
    phone: "",
    resolver: "resolver1",
    surname: "Builder",
    userid: "1002",
    username: "bob"
  }
];

describe("UserListPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the default realm and lists its users", async () => {
    stubAdminSession();
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<UserListPage />, { route: "/user/list" });

    await screen.findByText("Cooper");

    expect(screen.getByLabelText("Select Realm")).toHaveValue("realm1");

    const userLink = screen.getByRole("link", { name: "alice" });
    expect(userLink).toHaveAttribute("href", "#!/user/details/realm1/alice");
    expect(screen.getByRole("link", { name: "alice@example.com" })).toHaveAttribute(
      "href",
      "mailto:alice@example.com"
    );

    const userListCall = fetchMock.mock.calls.find(([input]) =>
      getFetchUrl(input).includes("/user/")
    );
    expect(userListCall).toBeDefined();

    if (!userListCall) {
      throw new Error("Expected the user list endpoint to be called.");
    }

    const requestedUrl = new URL(getFetchUrl(userListCall[0]));
    expect(requestedUrl.searchParams.get("realm")).toBe("realm1");
  });

  it("refetches with wildcard filters when a column filter is used", async () => {
    stubAdminSession();
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    renderWithProviders(<UserListPage />, { route: "/user/list" });

    await screen.findByText("Cooper");
    await user.type(screen.getByLabelText("username"), "ali");

    await waitFor(() => {
      const lastUserCall = fetchMock.mock.calls
        .filter(([input]) => getFetchUrl(input).includes("/user/"))
        .at(-1);
      expect(lastUserCall).toBeDefined();

      if (!lastUserCall) {
        throw new Error("Expected the user list endpoint to be called.");
      }

      const requestedUrl = new URL(getFetchUrl(lastUserCall[0]));
      expect(requestedUrl.searchParams.get("username")).toBe("*ali*");
    });
  });
});

function stubAdminSession(): void {
  stubSession({
    auth_token: "legacy-token",
    menus: [],
    realm: "",
    rights: ["userlist"],
    role: "admin",
    username: "admin"
  });
}

function createBackendMock(): ReturnType<typeof vi.fn<typeof fetch>> {
  const fetchMock = vi.fn<typeof fetch>();

  fetchMock.mockImplementation((input) => {
    const url = getFetchUrl(input);

    if (url.includes("/realm/")) {
      return Promise.resolve(createEnvelopeResponse(realms));
    }

    if (url.includes("/user/")) {
      return Promise.resolve(createEnvelopeResponse(users));
    }

    return Promise.reject(new Error(`Unexpected request: ${url}`));
  });

  return fetchMock;
}
