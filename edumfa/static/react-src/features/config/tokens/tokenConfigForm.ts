import { isConfigEnabled, type SystemConfig } from "@/api/config";
import type { SystemConfigRequest } from "@/api/system";
import { configValueToText } from "@/features/config/system/systemConfigForm";

/** A config entry as shown by the token forms: text, or a boolean for the checkboxes. */
export type TokenConfigValue = boolean | string;

/** Every config key with its value; the legacy `$scope.form`. */
export type TokenConfigForm = Record<string, TokenConfigValue>;

/** The entries the user changed, keyed by config key. */
export type TokenConfigEdits = Record<string, TokenConfigValue>;

export const tokenConfigTypeKeys = [
  "hotp",
  "totp",
  "u2f",
  "webauthn",
  "radius",
  "remote",
  "sms",
  "tiqr",
  "email",
  "question",
  "yubico",
  "yubikey",
  "daypassword"
] as const;

export type TokenConfigTypeKey = (typeof tokenConfigTypeKeys)[number];

export function isTokenConfigTypeKey(value: string): value is TokenConfigTypeKey {
  return (tokenConfigTypeKeys as readonly string[]).includes(value);
}

export const defaultSmsProvider =
  "edumfa.lib.smsprovider.HttpSMSProvider.HttpSMSProvider";

/** The legacy `formInit` lists. */
export const smsProviders = [
  defaultSmsProvider,
  "edumfa.lib.smsprovider.SipgateSMSProvider.SipgateSMSProvider",
  "edumfa.lib.smsprovider.SmtpSMSProvider.SmtpSMSProvider"
];
export const hashlibs = ["sha1", "sha256", "sha512"];
export const totpTimeSteps = ["30", "60"];

export const questionKeyPrefix = "question.question.";
export const yubikeyApiKeyPrefix = "yubikey.apiid.";

/**
 * Port of `loadSystemConfig` in `tokenConfigController`: the defaults the
 * selects need and the checkbox values as booleans. The `radius.secret.type`,
 * `radius.dictfile` and `email.password.type` presets of the legacy
 * controller belong to inputs the partials no longer have and are left out.
 */
export function readTokenConfigForm(config: SystemConfig): TokenConfigForm {
  const form: TokenConfigForm = {};

  for (const [key, value] of Object.entries(config)) {
    form[key] = configValueToText(value);
  }

  form["totp.timeStep"] = getText(form, "totp.timeStep") || "30";
  form["totp.hashlib"] = getText(form, "totp.hashlib") || "sha1";
  form["hotp.hashlib"] = getText(form, "hotp.hashlib") || "sha1";
  form["sms.Provider"] = getText(form, "sms.Provider") || defaultSmsProvider;
  form["totp.useTimeShift"] = isConfigEnabled(config["totp.useTimeShift"]);
  form["email.tls"] = isConfigEnabled(config["email.tls"]);
  form["remote.verify_ssl_certificate"] = isConfigEnabled(
    config["remote.verify_ssl_certificate"]
  );

  return form;
}

/**
 * Port of `saveTokenConfig`: only the entries that differ from the loaded
 * form are posted.
 */
export function buildTokenConfigRequest(
  base: TokenConfigForm,
  edits: TokenConfigEdits
): SystemConfigRequest {
  const request: SystemConfigRequest = {};

  for (const [key, value] of Object.entries(edits)) {
    if (value !== base[key]) {
      request[key] = value;
    }
  }

  return request;
}

export function getText(form: TokenConfigForm, key: string): string {
  const value = form[key];

  return typeof value === "string" ? value : "";
}

export function getFlag(form: TokenConfigForm, key: string): boolean {
  const value = form[key];

  return typeof value === "boolean" ? value : isConfigEnabled(value);
}

export interface PrefixedConfigEntry {
  key: string;
  /** The key without the prefix, e.g. the question index or the Yubikey client id. */
  suffix: string;
  value: string;
}

/** The stored `question.question.*` or `yubikey.apiid.*` entries, in natural order. */
export function listPrefixedEntries(
  config: SystemConfig,
  prefix: string
): PrefixedConfigEntry[] {
  return Object.entries(config)
    .filter(([key]) => key.startsWith(prefix))
    .map(([key, value]) => ({
      key,
      suffix: key.slice(prefix.length),
      value: configValueToText(value)
    }))
    .sort((left, right) =>
      left.key.localeCompare(right.key, undefined, { numeric: true })
    );
}

/** The index of the next question: one above the highest stored index. */
export function getNextQuestionIndex(config: SystemConfig): number {
  const indexes = listPrefixedEntries(config, questionKeyPrefix)
    .map((entry) => Number.parseInt(entry.suffix, 10))
    .filter((index) => Number.isInteger(index) && index >= 0);

  return indexes.length === 0 ? 0 : Math.max(...indexes) + 1;
}

/**
 * Options of a select with a fixed list: the list itself, preceded by a
 * blank entry while nothing is chosen, or by an unknown stored value.
 */
export function fixedOptions(options: readonly string[], current: string): string[] {
  return options.includes(current) ? [...options] : [current, ...options];
}

/**
 * Port of the legacy `formTokenConfig.$invalid` check: the `required`
 * inputs of the partial must be filled and `type="url"` inputs hold an
 * absolute URL. The Yubikey page needs a new client id with an API key.
 */
export function isTokenConfigValid(
  tokentype: TokenConfigTypeKey,
  form: TokenConfigForm,
  edits: TokenConfigEdits
): boolean {
  const filled = (key: string) => getText(form, key) !== "";
  const url = (key: string) => isAbsoluteUrl(getText(form, key));
  const optionalUrl = (key: string) => !filled(key) || url(key);

  switch (tokentype) {
    case "totp":
      return filled("totp.timeWindow") && filled("totp.timeShift");
    case "u2f":
      return url("u2f.appId");
    case "remote":
      return filled("remote.server");
    case "tiqr":
      return (
        url("tiqr.regServer") &&
        optionalUrl("tiqr.authServer") &&
        url("tiqr.logoUrl") &&
        url("tiqr.infoUrl")
      );
    case "question":
      return filled("question.num_answers");
    case "yubico":
      return filled("yubico.id") && filled("yubico.secret") && url("yubico.url");
    case "yubikey":
      return Object.entries(edits).some(
        ([key, value]) =>
          key.startsWith(yubikeyApiKeyPrefix) &&
          key.length > yubikeyApiKeyPrefix.length &&
          value !== ""
      );
    case "daypassword":
      return filled("daypassword.timeStep");
    default:
      return true;
  }
}

function isAbsoluteUrl(value: string): boolean {
  if (value === "") {
    return false;
  }

  try {
    new URL(value);

    return true;
  } catch {
    return false;
  }
}
