import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TokenConfigPage } from "./TokenConfigPage";
import {
  createRouteFetchMock,
  findFetchCalls,
  getJsonRequestBody,
  stubSession
} from "@/tests/fetchMockUtils";
import { fieldLabel } from "@/tests/labels";
import { renderWithProviders } from "@/tests/renderWithProviders";

describe("TokenConfigPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves only changed settings and resets pending changes on a type switch", async () => {
    stubSession({ rights: ["configread", "configwrite"] });
    const fetchMock = createBackend({
      "hotp.hashlib": "sha1",
      "totp.hashlib": "sha1",
      "totp.timeWindow": "180",
      "totp.timeShift": "0",
      unrelated: "keep"
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage("hotp");
    await user.selectOptions(await screen.findByLabelText("Default Hashlib"), "sha256");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    });
    expect(
      getJsonRequestBody(
        findFetchCalls(fetchMock, "POST", "/system/setConfig")[0]?.init
      )
    ).toEqual({ "hotp.hashlib": "sha256" });
    await user.selectOptions(screen.getByLabelText("Default Hashlib"), "sha512");
    // Replacing the route parameter must not carry HOTP edits into TOTP.
    await user.click(screen.getByRole("link", { name: "Switch to TOTP" }));
    expect(await screen.findByLabelText("Default Hashlib")).toHaveValue("sha1");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("adds questions and confirms deletion before changing the server config", async () => {
    stubSession(
      { rights: ["configread", "configwrite", "configdelete"] },
      { deletion_confirmation: true }
    );
    const fetchMock = createBackend({
      "question.num_answers": "2",
      "question.question.0": "First pet?"
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage("question");
    await screen.findByText("First pet?");
    fireEvent.change(screen.getByLabelText("Question"), {
      target: { value: "First school?" }
    });
    await user.click(screen.getByRole("button", { name: "Add new question" }));
    expect(await screen.findByText("First school?")).toBeInTheDocument();
    expect(
      getJsonRequestBody(
        findFetchCalls(fetchMock, "POST", "/system/setConfig")[0]?.init
      )
    ).toEqual({ "question.question.1": "First school?" });
    const row = screen.getByText("First pet?").closest("tr");
    if (!row) throw new Error("Missing question row");
    await user.click(
      within(row).getByRole("button", {
        name: "Delete"
      })
    );
    expect(
      findFetchCalls(fetchMock, "DELETE", "/system/question.question.0")
    ).toHaveLength(0);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" })
    );
    await waitFor(() => {
      expect(screen.queryByText("First pet?")).not.toBeInTheDocument();
    });
  });

  it("generates and stores a Yubikey API key under its client id", async () => {
    stubSession({ rights: ["configread", "configwrite"] });
    const fetchMock = createBackend({});
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage("yubikey");
    fireEvent.change(await screen.findByLabelText("Client ID"), {
      target: { value: "42" }
    });
    await user.click(screen.getByRole("button", { name: "Create new API key" }));
    await waitFor(() => {
      expect(screen.getByLabelText("API Key")).toHaveValue("generated-test-key");
    });
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("generated-test-key")).toBeInTheDocument();
    expect(
      getJsonRequestBody(
        findFetchCalls(fetchMock, "POST", "/system/setConfig")[0]?.init
      )
    ).toEqual({ "yubikey.apiid.42": "generated-test-key" });
    expect(screen.getByLabelText("Client ID")).toHaveValue("");
  });

  it("validates required token settings and prevents writes without permission", async () => {
    stubSession({ rights: ["configread"] });
    const fetchMock = createBackend({
      "question.num_answers": "2",
      "question.question.0": "First pet?"
    });
    vi.stubGlobal("fetch", fetchMock);
    renderPage("question");
    const input = await screen.findByLabelText(fieldLabel("Number of answers"));
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: "3" } });
    const form = input.closest("form");
    if (!form) throw new Error("Missing config form");
    fireEvent.submit(form);
    expect(findFetchCalls(fetchMock, "POST", "/system/setConfig")).toHaveLength(0);
  });

  it("keeps invalid required settings from being saved", async () => {
    stubSession({ rights: ["configread", "configwrite"] });
    vi.stubGlobal("fetch", createBackend({ "question.num_answers": "2" }));
    renderPage("question");
    fireEvent.change(await screen.findByLabelText(fieldLabel("Number of answers")), {
      target: { value: "" }
    });
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});

function renderPage(type: string) {
  return renderWithProviders(
    <>
      <Link to="/config/tokens/totp">Switch to TOTP</Link>
      <Routes>
        <Route path="/config/tokens/:tokentype" element={<TokenConfigPage />} />
      </Routes>
    </>,
    { route: `/config/tokens/${type}` }
  );
}

function createBackend(initialConfig: Record<string, unknown>) {
  const config = { ...initialConfig };
  return createRouteFetchMock([
    { path: "/system/", respond: () => config },
    {
      method: "POST",
      path: "/system/setConfig",
      respond: (_url, init) => {
        Object.assign(config, getJsonRequestBody(init));
        return {};
      }
    },
    {
      method: "DELETE",
      path: "/system/question.question.0",
      respond: () => {
        delete config["question.question.0"];
        return 1;
      }
    },
    { path: "/system/random", respond: () => "generated-test-key" }
  ]);
}
