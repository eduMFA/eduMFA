import type { EventHandlerDefinition, EventWriteParams } from "@/api/events";
import type { PeriodicTask, PeriodicTaskWriteParams } from "@/api/periodicTasks";
import {
  hasOptionValue,
  toOptionRequestValue,
  type TypedOptionSpec,
  type TypedOptionValue
} from "@/components/forms/TypedOptionInput";

/** Option/condition name -> current value as edited in the form. */
export type DefinitionValues = Record<string, TypedOptionValue>;

export interface EventForm {
  name: string;
  active: boolean;
  ordering: number | string;
  event: string[];
  handlermodule: string;
  action: string;
  position: string;
  conditions: DefinitionValues;
  options: DefinitionValues;
}

export interface TaskForm {
  name: string;
  active: boolean;
  ordering: number | string;
  interval: string;
  nodes: string[];
  taskmodule: string;
  retry_if_failed: boolean;
  options: DefinitionValues;
}

/** Copies a stored handler into editable form state, or returns defaults for a new one. */
export function readEventForm(event?: EventHandlerDefinition): EventForm {
  return event
    ? {
        ...event,
        event: [...event.event],
        options: { ...event.options },
        conditions: { ...event.conditions }
      }
    : {
        name: "",
        active: true,
        ordering: 0,
        event: [],
        handlermodule: "",
        action: "",
        position: "",
        options: {},
        conditions: {}
      };
}

/** Copies a stored task into editable form state, or returns defaults for a new one. */
export function readTaskForm(task?: PeriodicTask): TaskForm {
  return task
    ? { ...task, nodes: [...task.nodes], options: { ...task.options } }
    : {
        name: "",
        active: true,
        ordering: 0,
        interval: "",
        nodes: [],
        taskmodule: "",
        retry_if_failed: true,
        options: {}
      };
}

/** Builds the /event request; options are sent flattened as `option.<name>`. */
export function eventRequest(form: EventForm, id?: number): EventWriteParams {
  const request: EventWriteParams = {
    ...(id === undefined ? {} : { id }),
    name: form.name,
    active: form.active,
    ordering: Number(form.ordering),
    event: form.event.join(","),
    handlermodule: form.handlermodule,
    action: form.action,
    position: form.position,
    conditions: Object.fromEntries(
      Object.entries(form.conditions).map(([key, value]) => [
        key,
        String(toOptionRequestValue(value))
      ])
    )
  };
  for (const [key, value] of Object.entries(form.options))
    request[`option.${key}`] = toOptionRequestValue(value);
  return request;
}

/** Builds the /periodictask request; options are sent as a nested object. */
export function taskRequest(form: TaskForm, id?: number): PeriodicTaskWriteParams {
  return {
    ...(id === undefined ? {} : { id }),
    name: form.name,
    active: form.active,
    ordering: Number(form.ordering),
    interval: form.interval,
    nodes: form.nodes.join(", "),
    taskmodule: form.taskmodule,
    retry_if_failed: form.retry_if_failed,
    options: Object.fromEntries(
      Object.entries(form.options).map(([key, value]) => [
        key,
        toOptionRequestValue(value)
      ])
    )
  };
}

/** The order must be a non-negative integer (the input may still hold a string). */
export function validOrder(value: number | string) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/** Required options must be set and `int` options must be integers. */
export function validOptions(
  options: readonly (readonly [string, TypedOptionSpec])[],
  values: DefinitionValues
) {
  return options.every(([name, spec]) => {
    const value = values[name];
    if (spec.required && !hasOptionValue(value)) return false;
    return (
      spec.type !== "int" || !hasOptionValue(value) || Number.isInteger(Number(value))
    );
  });
}

/** Keep stored selections visible when a module's choices have changed. */
export function choicesWithCurrent(choices: readonly string[], current: string) {
  return ["", ...new Set([...choices, ...(current ? [current] : [])])];
}

/**
 * Merges the module's option specs with stored values (unknown stored options become
 * plain strings) and, for single-choice options, adds a stored value that is no longer
 * offered so it is not silently lost.
 */
export function optionEntries(
  specs: Record<string, TypedOptionSpec>,
  values: DefinitionValues
): [string, TypedOptionSpec][] {
  return [...new Set([...Object.keys(specs), ...Object.keys(values)])]
    .sort()
    .map((key) => {
      const spec = specs[key] ?? { type: "str" };
      const value = values[key];
      const choices = spec.value;
      return [
        key,
        choices &&
        spec.type !== "multi" &&
        (typeof value === "string" || typeof value === "number") &&
        value !== ""
          ? {
              ...spec,
              value: [
                ...choices.filter(
                  (choice) =>
                    String(typeof choice === "object" ? choice.name : choice) !==
                    String(value)
                ),
                value
              ]
            }
          : spec
      ];
    });
}
