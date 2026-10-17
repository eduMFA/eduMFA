import { afterEach, describe, expect, it } from "vitest";

import { getInstanceUrl, readLoginPageConfig } from "./loginPageConfig";

describe("readLoginPageConfig", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("reads the hidden inputs rendered by the Flask view", () => {
    document.body.innerHTML = [
      '<input type="hidden" id="REMOTE_USER" value="foo">',
      '<input type="hidden" id="FORCE_REMOTE_USER" value="True">',
      '<input type="hidden" id="PASSWORD_RESET" value="True">',
      '<input type="hidden" id="HSM_READY" value="False">',
      '<input type="hidden" id="REALMS" value="realmB,realmA">',
      '<input type="hidden" id="LOGO" value="logo.png">',
      '<input type="hidden" id="LOGIN_TEXT" value="Welcome">'
    ].join("");

    expect(readLoginPageConfig(document, "/edumfa/")).toEqual({
      forceRemoteUser: true,
      hsmReady: false,
      loginText: "Welcome",
      logoUrl: "/edumfa/static/css/logo.png",
      passwordReset: true,
      realms: ["realmA", "realmB"],
      remoteUser: "foo"
    });
  });

  it("falls back to a plain credentials login", () => {
    expect(readLoginPageConfig(document, "/")).toEqual({
      forceRemoteUser: false,
      hsmReady: true,
      loginText: "",
      logoUrl: null,
      passwordReset: false,
      realms: [],
      remoteUser: ""
    });
  });
});

describe("getInstanceUrl", () => {
  it("drops the trailing slash like the legacy constant", () => {
    expect(getInstanceUrl("/")).toBe("");
    expect(getInstanceUrl("/edumfa/")).toBe("/edumfa");
  });
});
