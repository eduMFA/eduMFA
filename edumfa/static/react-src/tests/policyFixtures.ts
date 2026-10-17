import type {
  Policy,
  PolicyConditionDefinitions,
  PolicyDefinitions
} from "@/api/policies";

export const policyDefinitions: PolicyDefinitions = {
  admin: {
    enable: { type: "bool", desc: "Enable tokens", group: "Tokens" },
    disable: { type: "bool", desc: "Disable tokens", group: "Tokens" }
  },
  register: {
    email: { type: "str" },
    realm: { type: "str", group: "", value: ["realm1", "realm2"] },
    resolver: { type: "str", group: null, value: ["ldap1"] }
  },
  authentication: {
    require_pin: { type: "bool", desc: "Require a PIN", group: "General" },
    maxfail: { type: "int", desc: "Maximum attempts", group: "General" },
    otppin: { type: "str", value: ["none", "userstore"], group: "General" },
    banner: { type: "text", group: "Display" },
    token_types: {
      type: "str",
      multiple: true,
      value: ["hotp", "totp"],
      group: "Tokens"
    }
  }
};

export const policyConditions: PolicyConditionDefinitions = {
  sections: {
    userinfo: { description: "User attributes" },
    tokeninfo: { description: "Token attributes" }
  },
  comparators: {
    equals: { description: "Exact match" },
    contains: { description: "Contains value" }
  }
};

export const storedPolicy: Policy = {
  name: "existing",
  scope: "authentication",
  active: false,
  priority: 5,
  action: { maxfail: "0", token_types: "hotp totp", custom_plugin: "unchanged=value" },
  realm: ["realm1", "old-realm"],
  resolver: ["ldap1"],
  adminrealm: [],
  adminuser: [],
  user: ["alice", "!bob"],
  client: ["10.0.0.0/8", "!10.0.0.124"],
  edumfanode: ["node1"],
  time: "Mon-Fri: 9-18",
  check_all_resolvers: true,
  conditions: [["userinfo", "department", "equals", "IT", true]]
};
