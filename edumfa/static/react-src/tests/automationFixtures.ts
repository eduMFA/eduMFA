import type { EventHandlerDefinition } from "@/api/events";
import type { PeriodicTask } from "@/api/periodicTasks";

export const storedEvent: EventHandlerDefinition = {
  id: 1,
  name: "Notify users",
  active: false,
  ordering: 4,
  event: ["token_init", "old_event"],
  handlermodule: "UserNotification",
  action: "sendmail",
  position: "post",
  conditions: { realm: "realm1,old-realm", serial: "^OATH", custom_condition: "keep" },
  options: {
    recipient: "custom",
    email: "admin@example.org",
    body: "Hello",
    enabled: "False",
    custom_option: "preserve"
  }
};
export const storedTask: PeriodicTask = {
  id: 2,
  name: "Clean tokens",
  active: false,
  ordering: 3,
  interval: "*/10 * * * *",
  nodes: ["node1", "retired-node"],
  retry_if_failed: false,
  taskmodule: "Simple",
  options: { message: "Hello", enabled: "False", custom_option: "preserve" },
  last_runs: { node1: "2026-10-17T10:00:00+00:00" },
  last_update: "2026-10-16T12:00:00+00:00"
};
export const eventActions = {
  sendmail: {
    recipient: { type: "str", required: true, value: ["user", "custom"] },
    email: {
      type: "str",
      required: true,
      visibleIf: "recipient",
      visibleValue: "custom"
    },
    body: { type: "text" },
    enabled: { type: "bool" },
    count: { type: "int" }
  },
  log: { message: { type: "str", required: true } }
};
export const eventConditions = {
  realm: {
    type: "multi",
    value: [{ name: "realm1" }, { name: "realm2" }],
    group: "User"
  },
  serial: { type: "regexp", group: null },
  result: { type: "str", value: ["True", "False"], group: "" }
};
export const taskOptions = {
  message: { type: "text", required: true },
  enabled: { type: "bool" },
  count: { type: "int" }
};
