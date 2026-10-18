import { useLingui } from "@lingui/react/macro";
import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";

import type { TaskFormChange } from "./types";
import { useTaskLookups } from "./useTaskLookups";
import type { PeriodicTask } from "@/api/periodicTasks";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import {
  taskRequest,
  readTaskForm,
  optionEntries,
  validOptions,
  validOrder
} from "@/features/config/automation/definitionForm";
import {
  taskDefinitionApi,
  useDefinitionMutations
} from "@/features/config/automation/useDefinitionMutations";
import { pushFlash } from "@/lib/flash";

/** Form state, lookups, validity and the save handler of the periodic task form. */
export function useTaskForm(existing: PeriodicTask | undefined) {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { rights } = useAuth();
  const canWrite = hasRight(rights, "periodictask_write");

  const [form, setForm] = useState(() => readTaskForm(existing));
  const change: TaskFormChange = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
  };
  const mutations = useDefinitionMutations(taskDefinitionApi);
  const lookups = useTaskLookups(form.taskmodule);
  const options = optionEntries(lookups.specs.data ?? {}, form.options);

  const valid = Boolean(
    lookups.ready &&
    form.name.trim() &&
    form.interval.trim() &&
    form.nodes.length > 0 &&
    form.taskmodule &&
    validOrder(form.ordering) &&
    validOptions(options, form.options)
  );

  const finish = () => {
    void navigate("/config/periodictasks/list");
  };
  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canWrite && valid && !mutations.busy)
      mutations.save.mutate(taskRequest(form, existing?.id), {
        onSuccess: () => {
          pushFlash(t`Periodic task saved.`, "info");
          finish();
        }
      });
  };

  return { canWrite, change, finish, form, lookups, mutations, options, submit, valid };
}
