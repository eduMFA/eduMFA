import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SystemDocumentationPage } from "./SystemDocumentationPage";
import { getFetchUrl, stubLegacySession } from "@/tests/fetchMockUtils";
import { renderWithProviders } from "@/tests/renderWithProviders";

const documentation = "System config\n=============\n\nsplitAtSign: True\n";

describe("SystemDocumentationPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the documentation text and offers it as a download", async () => {
    stubAdminSession();
    const fetchMock = createDocumentationMock(
      () => new Response(documentation, { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<SystemDocumentationPage />, {
      route: "/config/system/documentation"
    });

    expect(await screen.findByText(/splitAtSign: True/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Download documentation" })
    ).toHaveAttribute(
      "href",
      `data:text/plain;charset=utf-8,${encodeURIComponent(documentation)}`
    );
    expect(
      screen.getByRole("link", { name: "Download documentation" })
    ).toHaveAttribute("download", "documentation.rst");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows the policy error when the documentation is denied", async () => {
    stubAdminSession();
    vi.stubGlobal(
      "fetch",
      createDocumentationMock(
        () =>
          new Response(
            JSON.stringify({
              id: 1,
              jsonrpc: "2.0",
              result: {
                error: { code: 303, message: "system_documentation is not allowed" },
                status: false
              }
            }),
            { status: 403 }
          )
      )
    );

    renderWithProviders(<SystemDocumentationPage />, {
      route: "/config/system/documentation"
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "system_documentation is not allowed"
    );
    expect(
      screen.queryByRole("link", { name: "Download documentation" })
    ).not.toBeInTheDocument();
  });
});

function stubAdminSession(): void {
  stubLegacySession({
    auth_token: "legacy-token",
    menus: [],
    realm: "",
    rights: ["configread", "system_documentation"],
    role: "admin",
    username: "admin"
  });
}

/** The documentation endpoint answers plain text, so the envelope mock does not fit. */
function createDocumentationMock(respond: () => Response) {
  const fetchMock = vi.fn<typeof fetch>();

  fetchMock.mockImplementation((input) => {
    const url = new URL(getFetchUrl(input));

    if (url.pathname === "/system/documentation") {
      return Promise.resolve(respond());
    }

    return Promise.reject(new Error(`Unexpected request: ${url.pathname}`));
  });

  return fetchMock;
}
