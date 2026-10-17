import type { SystemConfig } from "@/api/config";
import type { TokenEnrollRequest } from "@/api/tokens";
import { hasRight } from "@/auth/permissions";
import { formatValidityPeriod } from "@/lib/dates";
import { fixUser } from "@/lib/users";

/**
 * Form model of the enrollment page, a port of `$scope.form` and
 * `$scope.newUser` in the legacy `tokenEnrollController`. Fields that the
 * legacy controller preset from policies, the system config or the selected
 * user are nullable here: `null` means "untouched, use the default", which
 * `resolveEnrollForm` fills in from the current context without effects.
 */

export type EnrollMode = "enroll" | "rollover" | "wizard";

export type CertificateMode = "certupload" | "csrgenerate" | "csrupload";

export interface FourEyesRealm {
  count: number;
  selected: boolean;
}

export const otpLengths = [6, 8] as const;
export const hashAlgorithms = ["sha1", "sha256", "sha512"] as const;
export const timeSteps = ["30", "60"] as const;
export const timeShiftOptions = ["default", "True", "False"] as const;

/** Token types whose secret is always typed or pasted, never generated. */
const manualKeyTypes = new Set(["indexedsecret", "vasco", "yubikey"]);

/** Token types that take an OTP key or secret from the form at all. */
const keyedTypes = new Set([
  "applspec",
  "daypassword",
  "hotp",
  "indexedsecret",
  "motp",
  "totp",
  "vasco",
  "yubikey"
]);

/** Token types without a PIN (`hidePin` in the legacy controller). */
export const pinlessTypes: ReadonlySet<string> = new Set(["certificate", "sshkey"]);

export interface EnrollFormState {
  /** CA connector; `null` picks the first configured one. */
  ca: string | null;
  certificate: string;
  certificateMode: CertificateMode;
  certificateRequest: string;
  description: string;
  dynamicEmail: boolean;
  dynamicPhone: boolean;
  /** `null` uses the selected user's email address. */
  email: string | null;
  fourEyes: Record<string, FourEyesRealm>;
  /** `null` derives the default from the token type. */
  genkey: boolean | null;
  /** `null` uses the `<type>.hashlib` system default. */
  hashlib: string | null;
  motpPin: string;
  motpPinRepeat: string;
  /** `null` uses the indexed secret preset attribute, otherwise empty. */
  otpkey: string | null;
  /** `null` is 6, or 44 for Yubikeys in AES mode. */
  otplen: number | null;
  /** `null` uses the selected user's mobile number when there is exactly one. */
  phone: string | null;
  pin: string;
  pinRepeat: string;
  questions: Record<string, string>;
  /** `null` uses the `radius.identifier` system default. */
  radiusIdentifier: string | null;
  radiusLocalCheckPin: boolean;
  radiusUser: string;
  /** `null` uses the default realm. */
  realm: string | null;
  remoteLocalCheckPin: boolean;
  remoteRealm: string;
  remoteResolver: string;
  remoteSerial: string;
  remoteServerId: string;
  remoteUser: string;
  separator: string;
  serviceId: string;
  smsIdentifier: string;
  sshkey: string;
  template: string;
  /** `null` uses the `<type>.timeStep` system default. */
  timeStep: string | null;
  /** `null` follows the `<type>_2step=force` right. */
  twoStepInit: boolean | null;
  /** `null` uses the default token type. */
  type: string | null;
  useTimeShift: string;
  user: string;
  useVascoSerial: boolean;
  validityEnd: Date | null;
  validityStart: Date | null;
  yubicoTokenId: string;
  yubikeyTest: string;
}

export const initialEnrollForm: EnrollFormState = {
  ca: null,
  certificate: "",
  certificateMode: "csrgenerate",
  certificateRequest: "",
  description: "",
  dynamicEmail: false,
  dynamicPhone: false,
  email: null,
  fourEyes: {},
  genkey: null,
  hashlib: null,
  motpPin: "",
  motpPinRepeat: "",
  otpkey: null,
  otplen: null,
  phone: null,
  pin: "",
  pinRepeat: "",
  questions: {},
  radiusIdentifier: null,
  radiusLocalCheckPin: false,
  radiusUser: "",
  realm: null,
  remoteLocalCheckPin: false,
  remoteRealm: "",
  remoteResolver: "",
  remoteSerial: "",
  remoteServerId: "",
  remoteUser: "",
  separator: "",
  serviceId: "",
  smsIdentifier: "",
  sshkey: "",
  template: "",
  timeStep: null,
  twoStepInit: null,
  type: null,
  useTimeShift: "default",
  user: "",
  useVascoSerial: false,
  validityEnd: null,
  validityStart: null,
  yubicoTokenId: "",
  yubikeyTest: ""
};

/** Everything the defaults of the nullable fields are derived from. */
export interface EnrollFormContext {
  caConnectors: readonly string[];
  defaultRealm: string;
  defaultTokenType: string;
  /** Value of the `indexedsecret_preset_attribute` of the selected user. */
  indexedSecretPreset: string;
  rights: readonly string[];
  systemConfig: SystemConfig;
  userEmail: string;
  userPhones: readonly string[];
}

type NullableKeys =
  | "ca"
  | "email"
  | "genkey"
  | "hashlib"
  | "otpkey"
  | "otplen"
  | "phone"
  | "radiusIdentifier"
  | "realm"
  | "timeStep"
  | "twoStepInit"
  | "type";

export interface ResolvedEnrollForm extends Omit<EnrollFormState, NullableKeys> {
  ca: string;
  email: string;
  genkey: boolean;
  hashlib: string;
  otpkey: string;
  otplen: number;
  phone: string;
  radiusIdentifier: string;
  realm: string;
  timeStep: string;
  twoStepInit: boolean;
  type: string;
}

export function configString(config: SystemConfig, key: string): string | null {
  const value = config[key];

  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return null;
}

/** Port of the presets in `changeTokenType` and `loadSystemConfig`. */
export function resolveEnrollForm(
  form: EnrollFormState,
  context: EnrollFormContext
): ResolvedEnrollForm {
  const type = form.type ?? context.defaultTokenType;
  const config = context.systemConfig;

  return {
    ...form,
    ca: form.ca ?? context.caConnectors[0] ?? "",
    email: form.email ?? context.userEmail,
    genkey: form.genkey ?? !manualKeyTypes.has(type),
    hashlib:
      form.hashlib ??
      configString(config, `${type}.hashlib`) ??
      configString(config, "hotp.hashlib") ??
      "sha1",
    otpkey:
      form.otpkey ?? (type === "indexedsecret" ? context.indexedSecretPreset : ""),
    otplen: form.otplen ?? (type === "yubikey" ? 44 : 6),
    phone:
      form.phone ??
      (context.userPhones.length === 1 ? (context.userPhones[0] ?? "") : ""),
    radiusIdentifier:
      form.radiusIdentifier ?? configString(config, "radius.identifier") ?? "",
    realm: form.realm ?? context.defaultRealm,
    timeStep: form.timeStep ?? defaultTimeStep(type, config),
    twoStepInit: form.twoStepInit ?? hasRight(context.rights, `${type}_2step=force`),
    type
  };
}

function defaultTimeStep(type: string, config: SystemConfig): string {
  if (type === "totp") {
    return configString(config, "totp.timeStep") ?? "30";
  }

  if (type === "daypassword") {
    return configString(config, "daypassword.timeStep") ?? "60";
  }

  return "30";
}

/** The fields `changeTokenType` reset, so the new type's defaults apply. */
export const typeDependentFields: Partial<EnrollFormState> = {
  genkey: null,
  hashlib: null,
  otpkey: null,
  otplen: null,
  timeStep: null,
  twoStepInit: null
};

export const hexKeyPattern = /^[0-9a-fA-F]*$/;
export const yubikeyKeyPattern = /^[0-9a-fA-F ]{32}$/;
export const phonePattern = /^(\+[1-9]+)?([0-9][, .-]?){1,14}$/;

/**
 * Port of `setVascoSerial`: a 496 character hex blob carries the serial in
 * its first ten bytes. Anything else is not a VASCO blob.
 */
export function getVascoSerial(otpkey: string): string {
  if (otpkey.length !== 496 || !hexKeyPattern.test(otpkey)) {
    return "";
  }

  let decoded = "";

  for (let index = 0; index < 20; index += 2) {
    decoded += String.fromCharCode(parseInt(otpkey.slice(index, index + 2), 16));
  }

  return decoded;
}

/** Port of `sshkeyChanged`: the key comment becomes the description. */
export function getSshKeyComment(sshkey: string): string {
  return sshkey.split(" ").slice(2).join(" ");
}

export type EnrollFormError =
  | "description"
  | "descriptionLength"
  | "email"
  | "motpPin"
  | "otpkey"
  | "phone"
  | "pin"
  | "radiusUser"
  | "remoteServer"
  | "remoteTarget"
  | "serviceId"
  | "timeStep"
  | "validity"
  | "yubicoTokenId"
  | "yubikeyKey"
  | "yubikeyOtplen";

export interface EnrollValidationOptions {
  /** Token types that must get a description (`require_description`). */
  requireDescription: readonly string[];
}

/** The `ng-required`/`ng-pattern` rules of the legacy templates. */
export function validateEnrollForm(
  form: ResolvedEnrollForm,
  options: EnrollValidationOptions
): EnrollFormError[] {
  const errors: EnrollFormError[] = [];
  const { type } = form;

  if (form.pin !== form.pinRepeat) {
    errors.push("pin");
  }

  if (options.requireDescription.includes(type) && form.description.trim() === "") {
    errors.push("description");
  }

  if (form.description.length > 80) {
    errors.push("descriptionLength");
  }

  if (
    form.validityStart &&
    form.validityEnd &&
    form.validityEnd.getTime() < form.validityStart.getTime()
  ) {
    errors.push("validity");
  }

  if (
    ["daypassword", "hotp", "motp", "totp", "vasco"].includes(type) &&
    !form.genkey &&
    !hexKeyPattern.test(form.otpkey)
  ) {
    errors.push("otpkey");
  }

  switch (type) {
    case "applspec":
      if (!form.serviceId) {
        errors.push("serviceId");
      }
      break;
    case "daypassword":
      if (form.timeStep.trim() === "") {
        errors.push("timeStep");
      }
      break;
    case "email":
      if (!form.dynamicEmail && form.email.trim() === "") {
        errors.push("email");
      }
      break;
    case "motp":
      if (form.motpPin !== form.motpPinRepeat) {
        errors.push("motpPin");
      }
      break;
    case "radius":
      if (form.radiusUser.trim() === "") {
        errors.push("radiusUser");
      }
      break;
    case "remote":
      if (!form.remoteServerId) {
        errors.push("remoteServer");
      }
      if (form.remoteSerial.trim() === "" && form.remoteUser.trim() === "") {
        errors.push("remoteTarget");
      }
      break;
    case "sms":
      if (!form.dynamicPhone && !phonePattern.test(form.phone)) {
        errors.push("phone");
      }
      break;
    case "yubico":
      if (form.yubicoTokenId.trim() === "") {
        errors.push("yubicoTokenId");
      }
      break;
    case "yubikey":
      if (!yubikeyKeyPattern.test(form.otpkey)) {
        errors.push("yubikeyKey");
      }
      if (form.otplen < 32 || form.otplen > 99) {
        errors.push("yubikeyOtplen");
      }
      break;
    default:
      break;
  }

  return errors;
}

export interface EnrollSession {
  realm: string;
  role: string;
  username: string;
}

export interface EnrollRequestOptions {
  mode: EnrollMode;
  rolloverSerial?: string;
  session: EnrollSession;
}

/**
 * Port of `TokenFactory.enroll`'s parameter merge: users enroll for
 * themselves, admins send the selected user, and the PIN travels when set.
 * Second-step calls (client part, verification, FIDO) reuse this.
 */
export function buildSessionParams(
  form: Pick<ResolvedEnrollForm, "pin" | "realm" | "user">,
  session: EnrollSession
): TokenEnrollRequest {
  const params: TokenEnrollRequest = {};

  if (session.role === "user") {
    params.user = session.username;
    params.realm = session.realm;
  } else {
    const username = fixUser(form.user);

    if (username) {
      params.user = username;
      params.realm = form.realm;
    }
  }

  if (form.pin) {
    params.pin = form.pin;
  }

  return params;
}

/**
 * Builds the `POST /token/init` parameters the way the legacy form did:
 * the common OTP settings go with every type, plus the type's own keys.
 * `otpkey` is left out when the server generates the key, which the backend
 * rejects otherwise.
 */
export function buildEnrollRequest(
  form: ResolvedEnrollForm,
  options: EnrollRequestOptions
): TokenEnrollRequest {
  const { type } = form;
  const request: TokenEnrollRequest = {
    "2stepinit": form.twoStepInit,
    description: form.description,
    genkey: form.genkey,
    hashlib: form.hashlib,
    otplen: form.otplen,
    timeStep: /^\d+$/.test(form.timeStep) ? Number(form.timeStep) : form.timeStep,
    type,
    useTimeShift: form.useTimeShift,
    ...buildSessionParams(form, options.session)
  };

  if (keyedTypes.has(type) && !form.genkey && form.otpkey) {
    request.otpkey = form.otpkey;
  }

  if (form.validityStart) {
    request.validity_period_start = formatValidityPeriod(form.validityStart);
  }

  if (form.validityEnd) {
    request.validity_period_end = formatValidityPeriod(form.validityEnd);
  }

  if (options.mode === "rollover") {
    request.rollover = true;
    request.serial = options.rolloverSerial ?? "";
  }

  switch (type) {
    case "4eyes":
      request.separator = form.separator;
      request["4eyes"] = Object.entries(form.fourEyes)
        .filter(([, realm]) => realm.selected)
        .map(([realmName, realm]) => `${realmName}:${String(realm.count)}`)
        .join(",");
      break;
    case "applspec":
      request.service_id = form.serviceId;
      break;
    case "certificate":
      request.ca = form.ca;
      request.template = form.template;
      if (form.certificateMode === "certupload") {
        request.certificate = form.certificate;
      } else if (form.certificateMode === "csrupload") {
        request.request = form.certificateRequest;
      }
      break;
    case "email":
      request.dynamic_email = form.dynamicEmail;
      if (!form.dynamicEmail) {
        request.email = form.email;
      }
      break;
    case "motp":
      request.motppin = form.motpPin;
      break;
    case "question":
      request.questions = Object.fromEntries(
        Object.entries(form.questions).filter(([, answer]) => answer.trim() !== "")
      );
      break;
    case "radius":
      request["radius.identifier"] = form.radiusIdentifier;
      request["radius.local_checkpin"] = form.radiusLocalCheckPin;
      request["radius.system_settings"] = true;
      request["radius.user"] = form.radiusUser;
      break;
    case "remote":
      request["remote.local_checkpin"] = form.remoteLocalCheckPin;
      request["remote.realm"] = form.remoteRealm;
      request["remote.resolver"] = form.remoteResolver;
      request["remote.serial"] = form.remoteSerial;
      request["remote.server_id"] = form.remoteServerId;
      request["remote.user"] = form.remoteUser;
      break;
    case "sms":
      request.dynamic_phone = form.dynamicPhone;
      if (!form.dynamicPhone) {
        request.phone = form.phone;
      }
      if (form.smsIdentifier) {
        request["sms.identifier"] = form.smsIdentifier;
      }
      break;
    case "sshkey":
      request.sshkey = form.sshkey;
      break;
    case "vasco": {
      const vascoSerial = getVascoSerial(form.otpkey);

      if (form.useVascoSerial && vascoSerial) {
        request.serial = vascoSerial;
      }
      break;
    }
    case "yubico":
      request["yubico.tokenid"] = form.yubicoTokenId;
      break;
    default:
      break;
  }

  return request;
}

/** Mobile numbers come as one string or as a list, depending on the resolver. */
export function toPhoneList(value: unknown): string[] {
  if (typeof value === "string") {
    return value ? [value] : [];
  }

  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }

  return [];
}

/** The questionnaire questions configured as `question.question.<n>`. */
export function getConfiguredQuestions(config: SystemConfig): string[] {
  return Object.entries(config)
    .filter(([key]) => key.startsWith("question.question."))
    .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true }))
    .map(([, value]) => String(value));
}
