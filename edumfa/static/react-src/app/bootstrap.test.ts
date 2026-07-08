import { afterEach, describe, expect, it } from "vitest";

import { normalizeHashRoute, readReactBootstrapConfig } from "./bootstrap";

describe("React bootstrap config", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("normalizes Angular hash routes for React allowlist matching", () => {
    expect(normalizeHashRoute("#/component/clienttype")).toBe("/component/clienttype");
    expect(normalizeHashRoute("#!/register?next=login")).toBe("/register");
    expect(normalizeHashRoute("component/clienttype")).toBe("/component/clienttype");
  });

  it("reads the React flag and route allowlist from the mount node", () => {
    document.body.innerHTML = `
      <div
        id="react-root"
        data-angular-root-id="angular-root"
        data-react-enabled="true"
        data-react-routes="/component/clienttype,/register"
      ></div>
    `;

    expect(readReactBootstrapConfig()).toEqual({
      angularRootId: "angular-root",
      enabled: true,
      mountId: "react-root",
      routes: ["/component/clienttype", "/register"]
    });
  });
});
