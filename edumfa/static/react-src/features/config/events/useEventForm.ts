import { useLingui } from "@lingui/react/macro";
import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";

import { isEventFormValid, visibleEventOptions } from "./eventFormValidation";
import type { EventFormChange } from "./types";
import { useEventLookups } from "./useEventLookups";
import type { EventHandlerDefinition } from "@/api/events";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import {
  eventRequest,
  readEventForm
} from "@/features/config/automation/definitionForm";
import {
  eventDefinitionApi,
  useDefinitionMutations
} from "@/features/config/automation/useDefinitionMutations";
import { pushFlash } from "@/lib/flash";

/** Form state, lookups, validity and the save handler of the event handler form. */
export function useEventForm(existing: EventHandlerDefinition | undefined) {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { rights } = useAuth();
  const canWrite = hasRight(rights, "eventhandling_write");

  const [form, setForm] = useState(() => readEventForm(existing));
  const change: EventFormChange = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
  };
  const mutations = useDefinitionMutations(eventDefinitionApi);
  const lookups = useEventLookups(form.handlermodule);

  const options = visibleEventOptions(
    lookups.actions.data?.[form.action] ?? {},
    form.options
  );
  const selectedConditions = Object.entries(lookups.conditions.data ?? {}).filter(
    ([name]) => name in form.conditions
  );
  const valid = lookups.ready && isEventFormValid(form, options, selectedConditions);

  const finish = () => {
    void navigate("/config/events/list");
  };
  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canWrite && valid && !mutations.busy)
      mutations.save.mutate(eventRequest(form, existing?.id), {
        onSuccess: () => {
          pushFlash(t`Event handler saved.`, "info");
          finish();
        }
      });
  };

  return { canWrite, change, finish, form, lookups, mutations, options, submit, valid };
}
