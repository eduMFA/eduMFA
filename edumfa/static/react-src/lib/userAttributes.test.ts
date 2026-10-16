import { describe, expect, it } from "vitest";

import { getResolverUserFields, splitIntoColumns } from "./userAttributes";

describe("getResolverUserFields", () => {
  it("reads LDAP attributes from USERINFO", () => {
    const fields = getResolverUserFields({
      data: {
        USERINFO: JSON.stringify({
          email: "mail",
          phone: "telephoneNumber",
          username: "uid"
        })
      },
      resolvername: "ldap1",
      type: "ldapresolver"
    });

    expect(fields).toEqual([
      { name: "email", required: true, type: "email" },
      { name: "phone", required: false, type: "text" },
      { name: "username", required: true, type: "text" }
    ]);
  });

  it("reads SQL attributes from Map and drops userid", () => {
    const fields = getResolverUserFields({
      data: {
        Map: JSON.stringify({ password: "pw", userid: "id", username: "login" })
      },
      resolvername: "sql1",
      type: "sqlresolver"
    });

    expect(fields.map((field) => field.name)).toEqual(["password", "username"]);
    expect(fields[0]).toEqual({ name: "password", required: true, type: "password" });
  });

  it("returns nothing for resolver types without an attribute map", () => {
    expect(
      getResolverUserFields({
        data: {},
        resolvername: "passwd",
        type: "passwdresolver"
      })
    ).toEqual([]);
    expect(getResolverUserFields(undefined)).toEqual([]);
  });

  it("ignores malformed JSON", () => {
    expect(
      getResolverUserFields({
        data: { Map: "{oops" },
        resolvername: "sql1",
        type: "sqlresolver"
      })
    ).toEqual([]);
  });
});

describe("splitIntoColumns", () => {
  it("puts the larger half on the left like the legacy view", () => {
    expect(splitIntoColumns(["a", "b", "c"])).toEqual([["a", "b"], ["c"]]);
    expect(splitIntoColumns([])).toEqual([[], []]);
  });
});
