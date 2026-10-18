import {
  resolveEnrollForm,
  validateEnrollForm,
  type EnrollFormContext,
  type EnrollFormError,
  type EnrollFormState,
  type EnrollMode,
  type EnrollSession,
  type ResolvedEnrollForm
} from "./enrollForm";
import { getEnrollVisibility, type EnrollVisibility } from "./enrollVisibility";
import type { EnrollLookups } from "./fields/types";
import { useEnrollDefaults, type EnrollDefaults } from "./useEnrollDefaults";
import { useEnrollLookups } from "./useEnrollLookups";
import { useEnrollUserInfo } from "./useEnrollUserInfo";
import { useAuth } from "@/auth/AuthProvider";

/** Everything the form renders from: defaults, resolved values, validation. */
export interface EnrollFormModel {
  defaults: EnrollDefaults;
  errors: EnrollFormError[];
  lookups: EnrollLookups;
  /** Failed lookups in display order: enroll types, realms, user record, type lists. */
  queryErrors: (Error | null)[];
  resolved: ResolvedEnrollForm;
  visibility: EnrollVisibility;
}

export interface UseEnrollFormModelOptions {
  form: EnrollFormState;
  mode: EnrollMode;
  rolloverType: string;
  routeRealm: string;
  routeUser: string;
  session: EnrollSession;
}

/**
 * Port of the derived `$scope` state of `tokenEnrollController`: the
 * nullable form fields are resolved against the defaults, the selected
 * user and the type's lookups, then validated.
 */
export function useEnrollFormModel({
  form,
  mode,
  rolloverType,
  routeRealm,
  routeUser,
  session
}: UseEnrollFormModelOptions): EnrollFormModel {
  const { rights, settings } = useAuth();
  const defaults = useEnrollDefaults({
    isAdmin: session.role === "admin",
    isRollover: mode === "rollover",
    rolloverType,
    routeRealm
  });
  const preliminaryType = form.type ?? defaults.defaultTokenType;
  const needsIndexedSecretPreset =
    preliminaryType === "indexedsecret" && settings.indexedSecretPresetAttribute !== "";
  const userInfo = useEnrollUserInfo({
    needsIndexedSecretPreset,
    realm: form.realm ?? defaults.defaultRealm,
    routeUser,
    session,
    user: form.user
  });
  const { error: lookupsError, lookups } = useEnrollLookups(preliminaryType, {
    realmNames: defaults.realmNames,
    systemConfig: defaults.systemConfig,
    userPhones: userInfo.userPhones
  });
  const context: EnrollFormContext = {
    caConnectors: lookups.caConnectors.map((connector) => connector.connectorname),
    defaultRealm: defaults.defaultRealm,
    defaultTokenType: defaults.defaultTokenType,
    indexedSecretPreset: userInfo.indexedSecretPreset,
    rights,
    systemConfig: defaults.systemConfig,
    userEmail: userInfo.userEmail,
    userPhones: userInfo.userPhones
  };
  const resolved = resolveEnrollForm(form, context);

  return {
    defaults,
    errors: validateEnrollForm(resolved, {
      requireDescription: settings.requireDescription
    }),
    lookups,
    queryErrors: [...defaults.errors, userInfo.error, lookupsError],
    resolved,
    visibility: getEnrollVisibility({
      mode,
      rights,
      role: session.role,
      settings,
      type: resolved.type
    })
  };
}
