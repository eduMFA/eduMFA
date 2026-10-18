import type { EventOptionSpec } from "@/api/events";
import type { TypedOptionSpec } from "@/components/forms/TypedOptionInput";
import {
  optionEntries,
  validOptions,
  validOrder,
  type DefinitionValues,
  type EventForm
} from "@/features/config/automation/definitionForm";

/** The action's options without those whose `visibleIf` option does not currently have the required value. */
export function visibleEventOptions(
  specs: Record<string, EventOptionSpec>,
  values: DefinitionValues
) {
  return optionEntries(specs, values).filter(([name]) => {
    const spec = specs[name];
    return (
      !spec?.visibleIf ||
      String(values[spec.visibleIf] ?? "") === String(spec.visibleValue)
    );
  });
}

/** Every required field is set and the options and conditions pass their checks. */
export function isEventFormValid(
  form: EventForm,
  options: readonly (readonly [string, TypedOptionSpec])[],
  conditions: readonly (readonly [string, TypedOptionSpec])[]
): boolean {
  return Boolean(
    form.name.trim() &&
    form.event.length &&
    form.handlermodule &&
    form.action &&
    form.position &&
    validOrder(form.ordering) &&
    validOptions(options, form.options) &&
    validOptions(conditions, form.conditions)
  );
}
