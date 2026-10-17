import { describe, expect, it } from "vitest";

import {
  isRouteMigrated,
  matchesRoutePattern,
  migratedRoutePaths,
  shouldReactOwnRoute
} from "./routes";

describe("matchesRoutePattern", () => {
  it("matches exact routes", () => {
    expect(matchesRoutePattern("/register", "/register")).toBe(true);
    expect(matchesRoutePattern("/register", "/recovery")).toBe(false);
  });

  it("matches parameter segments against non-empty values", () => {
    expect(
      matchesRoutePattern("/reset/alice/HTZXVABC", "/reset/:user/:recoverycode")
    ).toBe(true);
    expect(matchesRoutePattern("/reset/alice", "/reset/:user/:recoverycode")).toBe(
      false
    );
    expect(
      matchesRoutePattern("/reset/alice/CODE/extra", "/reset/:user/:recoverycode")
    ).toBe(false);
  });

  it("does not treat parameter segments as static matches", () => {
    expect(matchesRoutePattern("/reset/:user/:recoverycode", "/reset/a/b")).toBe(false);
  });
});

describe("isRouteMigrated", () => {
  it("accepts every default migrated route", () => {
    expect(isRouteMigrated("#!/register", migratedRoutePaths)).toBe(true);
    expect(isRouteMigrated("#!/recovery", migratedRoutePaths)).toBe(true);
    expect(isRouteMigrated("#!/component/clienttype", migratedRoutePaths)).toBe(true);
    expect(isRouteMigrated("#!/token/list", migratedRoutePaths)).toBe(true);
    expect(isRouteMigrated("#!/token/details/HOTP0001", migratedRoutePaths)).toBe(true);
  });

  it("accepts parameterized reset routes", () => {
    expect(isRouteMigrated("#!/reset/alice/HTZXVABC", migratedRoutePaths)).toBe(true);
    expect(isRouteMigrated("#!/reset//HTZXVABC", migratedRoutePaths)).toBe(false);
  });

  it("keeps Angular ownership for unmigrated routes", () => {
    expect(isRouteMigrated("#!/config/system", migratedRoutePaths)).toBe(false);
    expect(isRouteMigrated("#!/config/policies/list", migratedRoutePaths)).toBe(false);
  });

  it("accepts the enrollment routes in every spelling ui-router produces", () => {
    expect(isRouteMigrated("#!/token/enroll//", migratedRoutePaths)).toBe(true);
    expect(isRouteMigrated("#!/token/enroll/realm1/alice", migratedRoutePaths)).toBe(
      true
    );
    expect(isRouteMigrated("#!/token/rollover/totp/TOTP0001", migratedRoutePaths)).toBe(
      true
    );
    expect(isRouteMigrated("#!/token/wizard", migratedRoutePaths)).toBe(true);
  });

  it("treats the empty hash as the login page", () => {
    expect(isRouteMigrated("#!/login", migratedRoutePaths)).toBe(true);
    expect(isRouteMigrated("#!/response", migratedRoutePaths)).toBe(true);
    expect(isRouteMigrated("#!/pinchange", migratedRoutePaths)).toBe(true);
    expect(isRouteMigrated("", ["/login"])).toBe(true);
    expect(isRouteMigrated("#!/", ["/login"])).toBe(true);
    expect(isRouteMigrated("#!/", ["/audit/log"])).toBe(false);
  });
});

describe("shouldReactOwnRoute", () => {
  it("requires the route to be allowlisted by Flask and shipped by the bundle", () => {
    expect(shouldReactOwnRoute("#!/user/list", ["/user/list"])).toBe(true);
    expect(shouldReactOwnRoute("#!/user/list", ["/audit/log"])).toBe(false);
    expect(shouldReactOwnRoute("#!/", ["/login"])).toBe(true);
    // A newer Flask allowlist must not make an older bundle hide Angular.
    expect(shouldReactOwnRoute("#!/config/system", ["/config/system"])).toBe(false);
  });
});
