import { isConfigEnabled, type SystemConfig } from "@/api/config";
import type { SystemConfigRequest } from "@/api/system";

/**
 * The entries of `config.system.edit.html`. Checkboxes are booleans like
 * the legacy `isChecked` conversions; the other inputs keep their text
 * because the backend stores every value as a string and the legacy form
 * posted the typed text unchanged.
 */
export interface SystemConfigForm {
  AutoResync: boolean;
  AutoResyncTimeout: string;
  DefaultChallengeValidityTime: string;
  DefaultCountWindow: string;
  DefaultMaxFailCount: string;
  DefaultOtpLen: string;
  DefaultSyncWindow: string;
  DisableAutoChallengeJanitor: boolean;
  DisableClientTracking: boolean;
  IncFailCountOnFalsePin: boolean;
  OverrideAuthorizationClient: string;
  PrependPin: boolean;
  ReturnSamlAttributes: boolean;
  ReturnSamlAttributesOnFail: boolean;
  UserCacheExpiration: string;
  failcounter_clear_timeout: string;
  no_auth_counter: boolean;
  "recovery.identifier": string;
  splitAtSign: boolean;
}

export type SystemConfigFormUpdate = Partial<SystemConfigForm>;

export interface SystemConfigCardProps {
  form: SystemConfigForm;
  onChange: (update: SystemConfigFormUpdate) => void;
}

/** Port of `getSystemConfig` in `configController`. */
export function readSystemConfigForm(config: SystemConfig): SystemConfigForm {
  return {
    AutoResync: isConfigEnabled(config.AutoResync),
    AutoResyncTimeout: configValueToText(config.AutoResyncTimeout),
    DefaultChallengeValidityTime: configValueToText(
      config.DefaultChallengeValidityTime
    ),
    DefaultCountWindow: configValueToText(config.DefaultCountWindow),
    DefaultMaxFailCount: configValueToText(config.DefaultMaxFailCount),
    DefaultOtpLen: configValueToText(config.DefaultOtpLen),
    DefaultSyncWindow: configValueToText(config.DefaultSyncWindow),
    DisableAutoChallengeJanitor: isConfigEnabled(config.DisableAutoChallengeJanitor),
    DisableClientTracking: isConfigEnabled(config.DisableClientTracking),
    IncFailCountOnFalsePin: isConfigEnabled(config.IncFailCountOnFalsePin),
    OverrideAuthorizationClient: configValueToText(config.OverrideAuthorizationClient),
    PrependPin: isConfigEnabled(config.PrependPin),
    ReturnSamlAttributes: isConfigEnabled(config.ReturnSamlAttributes),
    ReturnSamlAttributesOnFail: isConfigEnabled(config.ReturnSamlAttributesOnFail),
    UserCacheExpiration: configValueToText(config.UserCacheExpiration),
    failcounter_clear_timeout: configValueToText(config.failcounter_clear_timeout),
    no_auth_counter: isConfigEnabled(config.no_auth_counter),
    "recovery.identifier": configValueToText(config["recovery.identifier"]),
    splitAtSign: isConfigEnabled(config.splitAtSign)
  };
}

/**
 * The payload of `POST /system/setConfig`. `PrependPin.type` marks that
 * entry as public like the legacy controller did. Only the entries of the
 * form are sent, not the whole dictionary `GET /system/` returned.
 */
export function buildSystemConfigRequest(form: SystemConfigForm): SystemConfigRequest {
  return { ...form, "PrependPin.type": "public" };
}

/** Config values arrive as strings; numbers and booleans are shown as typed. */
export function configValueToText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

/**
 * Options of a server select: a blank entry (Angular rendered one for an
 * unset model), the identifiers sorted, and the current value when it is not
 * among them so a stale setting is not silently replaced.
 */
export function identifierOptions(
  identifiers: readonly string[],
  current: string
): string[] {
  const options = [...new Set(identifiers)].sort((left, right) =>
    left.localeCompare(right)
  );

  if (current && !options.includes(current)) {
    options.unshift(current);
  }

  return ["", ...options];
}
