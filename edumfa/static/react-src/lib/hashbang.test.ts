import { describe, expect, it } from "vitest";

import { hashHref, readHashbangLocation, toHashbangHref } from "./hashbang";

describe("hashHref", () => {
  it("prefixes paths the way Angular's ui-sref does", () => {
    expect(hashHref("/user/list")).toBe("#!/user/list");
    expect(hashHref("user/list")).toBe("#!/user/list");
    expect(
      toHashbangHref({ pathname: "/machine/list", search: "?resolver=hosts1" })
    ).toBe("#!/machine/list?resolver=hosts1");
  });
});

describe("readHashbangLocation", () => {
  it("reads hashbang and legacy hash addresses", () => {
    expect(readHashbangLocation("#!/machine/list?resolver=hosts1")).toMatchObject({
      pathname: "/machine/list",
      search: "?resolver=hosts1"
    });
    expect(readHashbangLocation("#/user/list")).toMatchObject({
      pathname: "/user/list"
    });
    expect(readHashbangLocation("")).toMatchObject({ pathname: "/", search: "" });
  });
});
