import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TokenImportPage } from "./TokenImportPage";
import {
  createRouteFetchMock,
  findFetchCalls,
  stubLegacySession
} from "@/tests/fetchMockUtils";
import { renderWithProviders } from "@/tests/renderWithProviders";

describe("TokenImportPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uploads the picked file with the file type and realm", async () => {
    stubAdminSession();
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    const { container } = renderWithProviders(<TokenImportPage />, {
      route: "/token/import"
    });

    await waitFor(() => {
      expect(screen.getByLabelText("Realm")).toHaveValue("realm1");
    });
    expect(screen.getByText("PGP Key ABCDEF01")).toBeInTheDocument();

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();
    await user.upload(
      fileInput as HTMLInputElement,
      new File(["HOTP1, 3132, hotp, 6\n"], "tokens.csv", { type: "text/csv" })
    );

    await screen.findByText("tokens.csv");
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();

    const [uploadCall] = findFetchCalls(fetchMock, "POST", "/token/load/tokens.csv");
    const body = uploadCall?.init?.body;
    expect(body).toBeInstanceOf(FormData);
    const formData = body as FormData;
    expect(formData.get("type")).toBe("OATH CSV");
    expect(formData.get("tokenrealms")).toBe("realm1");
    expect(formData.has("psk")).toBe(false);
    expect((formData.get("file") as File).name).toBe("tokens.csv");
  });

  it("sends the PSKC options when that format is chosen", async () => {
    stubAdminSession();
    const fetchMock = createBackendMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    const { container } = renderWithProviders(<TokenImportPage />, {
      route: "/token/import"
    });

    await user.selectOptions(screen.getByLabelText("File type"), "pskc");
    await user.type(
      screen.getByLabelText("Pre Shared Key"),
      "00112233445566778899aabbccddeeff"
    );
    await user.selectOptions(screen.getByLabelText("Verification"), "check_fail_soft");
    await user.upload(
      container.querySelector('input[type="file"]') as HTMLInputElement,
      new File(["<KeyContainer/>"], "tokens.pskc", { type: "text/xml" })
    );

    await screen.findByText("tokens.pskc");

    const [uploadCall] = findFetchCalls(fetchMock, "POST", "/token/load/tokens.pskc");
    const formData = uploadCall?.init?.body as FormData;
    expect(formData.get("type")).toBe("pskc");
    expect(formData.get("psk")).toBe("00112233445566778899aabbccddeeff");
    expect(formData.get("pskcValidateMAC")).toBe("check_fail_soft");
    expect(formData.has("password")).toBe(false);
  });
});

function stubAdminSession(): void {
  stubLegacySession({
    auth_token: "legacy-token",
    menus: [],
    realm: "",
    rights: ["tokenlist", "importtokens"],
    role: "admin",
    username: "admin"
  });
}

function createBackendMock() {
  return createRouteFetchMock([
    {
      path: "/realm/",
      respond: () => ({
        realm1: { default: true, resolver: [] },
        realm2: { resolver: [] }
      })
    },
    {
      path: "/system/gpgkeys",
      respond: () => ({
        ABCDEF01: {
          armor: "-----BEGIN PGP PUBLIC KEY BLOCK-----",
          fingerprint: "AB CD"
        }
      })
    },
    {
      method: "POST",
      path: "/token/load/tokens.csv",
      respond: () => ({ n_imported: 3, n_not_imported: 1 })
    },
    {
      method: "POST",
      path: "/token/load/tokens.pskc",
      respond: () => ({ n_imported: 2, n_not_imported: 0 })
    }
  ]);
}
