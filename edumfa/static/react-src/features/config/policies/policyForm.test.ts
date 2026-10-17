import { describe, expect, it } from "vitest";

import {
  buildPolicyRequest,
  isPolicyFormValid,
  isPolicyNameValid,
  readPolicyForm
} from "./policyForm";
import { policyDefinitions, storedPolicy } from "@/tests/policyFixtures";

describe("policy form", () => {
  it("round-trips existing conditions, unknown actions and inactive state", () => {
    const request = Object.fromEntries(
      Object.entries(storedPolicy).filter(([key]) => key !== "name")
    );
    expect(buildPolicyRequest(readPolicyForm(storedPolicy))).toEqual(request);
    const form = readPolicyForm(storedPolicy);
    const condition = form.conditions[0];
    if (!condition) throw new Error("Missing fixture condition");
    condition[1] = "changed";
    expect(storedPolicy.conditions[0]?.[1]).toBe("department");
  });

  it("serializes multiple choices with spaces and preserves zero-valued actions", () => {
    const form = {
      ...readPolicyForm(storedPolicy),
      actions: { maxfail: 0, token_types: ["hotp", "totp"], require_pin: true }
    };
    expect(isPolicyFormValid(form, policyDefinitions)).toBe(true);
    expect(buildPolicyRequest(form).action).toEqual({
      maxfail: 0,
      token_types: "hotp totp",
      require_pin: true
    });
  });

  it("validates selected action values, priority and active additional conditions", () => {
    const form = readPolicyForm(storedPolicy);
    expect(
      isPolicyFormValid({ ...form, actions: { maxfail: "" } }, policyDefinitions)
    ).toBe(false);
    expect(
      isPolicyFormValid({ ...form, actions: { maxfail: "1.5" } }, policyDefinitions)
    ).toBe(false);
    expect(
      isPolicyFormValid({ ...form, actions: { token_types: [] } }, policyDefinitions)
    ).toBe(false);
    expect(isPolicyFormValid({ ...form, priority: 0 }, policyDefinitions)).toBe(false);
    expect(
      isPolicyFormValid(
        { ...form, conditions: [["userinfo", "", "equals", "", true]] },
        policyDefinitions
      )
    ).toBe(false);
    expect(
      isPolicyFormValid(
        { ...form, conditions: [["userinfo", "", "equals", "", false]] },
        policyDefinitions
      )
    ).toBe(true);
  });

  it.each(["", "check", "CHECK", "defs", "edumfa-update-policy-test", "bad/name"])(
    "rejects invalid or reserved name %s",
    (name) => {
      expect(isPolicyNameValid(name)).toBe(false);
    }
  );
});
