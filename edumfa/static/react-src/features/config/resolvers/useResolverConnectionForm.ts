import { useLingui } from "@lingui/react/macro";
import { useState } from "react";

import {
  getResolverFieldError,
  toResolverTestRequest,
  type ResolverField,
  type ResolverValues
} from "./resolverFields";
import { buildResolverPayload, isResolverNameValid, toText } from "./resolverTypes";
import { useResolverTester, useSaveResolver } from "./useResolverEditor";
import { isResolverFlagSet, type ResolverType } from "@/api/resolvers";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { pushFlash } from "@/lib/flash";

export interface ResolverConnectionFormParams {
  defaults: ResolverValues;
  fields: ResolverField[];
  resolverName: string;
  storedData: Record<string, unknown> | null;
  type: ResolverType;
}

/**
 * The state of a connection-based resolver editor: the name, the field
 * values and their validity, and the test and save actions.
 */
export function useResolverConnectionForm({
  defaults,
  fields,
  resolverName,
  storedData,
  type
}: ResolverConnectionFormParams) {
  const { t } = useLingui();
  const { rights } = useAuth();
  const canWrite = hasRight(rights, "resolverwrite");
  const [name, setName] = useState(resolverName);
  const [values, setValues] = useState<ResolverValues>(() =>
    Object.fromEntries(
      fields.map((field) => {
        const value = storedData ? storedData[field.key] : defaults[field.key];
        return [
          field.key,
          field.kind === "checkbox" ? isResolverFlagSet(value) : toText(value)
        ];
      })
    )
  );
  const tester = useResolverTester();
  const saveMutation = useSaveResolver({
    onSaved: () => {
      if (type === "ldapresolver") {
        pushFlash(
          t`Please remember to restart eduMFA when modifying an existing LDAP resolver.`,
          "warning"
        );
      }
    }
  });
  const visibleFields = fields.filter(
    (field) => !field.showWhen || field.showWhen(values)
  );
  const valid =
    isResolverNameValid(name) &&
    visibleFields.every((field) => !getResolverFieldError(field, values[field.key]));
  const busy = tester.isPending || saveMutation.isPending;
  const request = () =>
    buildResolverPayload(
      type,
      {
        ...values,
        // HTTP parses this field even when special error handling is disabled.
        ...(type === "httpresolver" && !values.hasSpecialErrorHandler
          ? { errorResponse: "{}" }
          : {})
      },
      storedData
    );
  const update = (changes: ResolverValues) => {
    setValues((previous) => ({ ...previous, ...changes }));
    tester.dismiss();
  };
  const test = (quick = false) => {
    if (!canWrite || !valid || busy) return;
    tester.test(toResolverTestRequest(type, request(), resolverName, quick));
  };
  const save = () => {
    if (canWrite && valid && !busy)
      saveMutation.mutate({ resolverName: name, request: request() });
  };

  return {
    busy,
    canWrite,
    name,
    save,
    saveMutation,
    setName,
    test,
    tester,
    update,
    valid,
    values,
    visibleFields
  };
}
