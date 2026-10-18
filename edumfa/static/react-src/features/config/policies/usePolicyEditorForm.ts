import { useLingui } from "@lingui/react/macro";
import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";

import {
  buildPolicyRequest,
  isPolicyFormValid,
  readPolicyForm,
  type PolicyFormValues
} from "./policyForm";
import { usePolicyMutations } from "./usePolicyMutations";
import type { Policy, PolicyDefinitions, PolicyTemplate } from "@/api/policies";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { notify } from "@/lib/notify";

/** Form state, rights, validity and the save handler of the policy editor. */
export function usePolicyEditorForm(
  policy: Policy | undefined,
  definitions: PolicyDefinitions
) {
  const { t } = useLingui();
  const { rights } = useAuth();
  const canWrite = hasRight(rights, "policywrite");
  const canDelete = hasRight(rights, "policydelete");
  const navigate = useNavigate();
  const [form, setForm] = useState(() => readPolicyForm(policy));
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const mutations = usePolicyMutations();
  const update = (changes: Partial<PolicyFormValues>) => {
    setForm((previous) => ({ ...previous, ...changes }));
  };
  const applyTemplate = (template: PolicyTemplate) => {
    setForm(readPolicyForm(template));
  };
  const valid = isPolicyFormValid(form, definitions);
  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canWrite && valid && !mutations.busy && !loadingTemplate)
      mutations.save.mutate(
        { name: form.name, request: buildPolicyRequest(form) },
        {
          onSuccess: () => {
            notify(t`Policy saved.`, "success");
            void navigate("/config/policies/list");
          }
        }
      );
  };

  return {
    applyTemplate,
    canDelete,
    canWrite,
    form,
    loadingTemplate,
    mutations,
    setLoadingTemplate,
    submit,
    update,
    valid
  };
}
