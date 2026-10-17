import { afterEach, describe, expect, it } from "vitest";

import { getInstanceUrl, readUiConfig } from "./uiConfig";

describe("readUiConfig", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("reads the JSON block rendered by the Flask view", () => {
    document.body.innerHTML = `<script id="edumfa-ui-config" type="application/json">${JSON.stringify(
      {
        browser_lang: "de",
        external_links: false,
        force_remote_user: true,
        gdpr_link: "https://example.com/privacy",
        has_job_queue: true,
        hsm_ready: false,
        login_text: "Welcome",
        logo: "logo.png",
        password_reset: true,
        realms: ["realmB", "realmA"],
        remote_user: "foo",
        show_node: "node1"
      }
    )}</script>`;

    expect(readUiConfig(document, "/edumfa/")).toEqual({
      browserLanguage: "de",
      customizationPath: "static/customize",
      externalLinks: false,
      forceRemoteUser: true,
      gdprLink: "https://example.com/privacy",
      hasJobQueue: true,
      hsmReady: false,
      instanceUrl: "/edumfa",
      loginText: "Welcome",
      logo: "logo.png",
      passwordReset: true,
      realms: ["realmA", "realmB"],
      remoteUser: "foo",
      showNode: "node1"
    });
  });

  it("falls back to the hidden inputs of the legacy template", () => {
    document.body.innerHTML = [
      '<input type="hidden" id="REMOTE_USER" value="foo">',
      '<input type="hidden" id="FORCE_REMOTE_USER" value="True">',
      '<input type="hidden" id="PASSWORD_RESET" value="True">',
      '<input type="hidden" id="HSM_READY" value="False">',
      '<input type="hidden" id="REALMS" value="realmB,realmA">',
      '<input type="hidden" id="LOGO" value="logo.png">',
      '<input type="hidden" id="HAS_JOB_QUEUE" value="True">',
      '<input type="hidden" id="LOGIN_TEXT" value="Welcome">'
    ].join("");

    expect(readUiConfig(document, "/")).toMatchObject({
      forceRemoteUser: true,
      hasJobQueue: true,
      hsmReady: false,
      instanceUrl: "",
      loginText: "Welcome",
      logo: "logo.png",
      passwordReset: true,
      realms: ["realmA", "realmB"],
      remoteUser: "foo"
    });
  });

  it("defaults to a plain credentials login", () => {
    expect(readUiConfig(document, "/")).toMatchObject({
      forceRemoteUser: false,
      hasJobQueue: false,
      hsmReady: true,
      loginText: "",
      logo: "",
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
