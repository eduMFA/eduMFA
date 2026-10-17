/**
 * Settings the Flask view (`webui/login.py`) renders into `index.html`:
 * the web server user, the realm dropdown, the HSM state, the instance
 * customisation and a few feature flags. They are read once per page load.
 */
export interface UiConfig {
  browserLanguage: string;
  /** Path of the customisation folder (`EDUMFA_CUSTOMIZATION`). */
  customizationPath: string;
  externalLinks: boolean;
  /** `remote_user=force`: credentials login is not offered. */
  forceRemoteUser: boolean;
  /** Privacy statement link (`gdpr_link` policy). */
  gdprLink: string;
  /** A job queue is configured; the SMTP form offers queued delivery. */
  hasJobQueue: boolean;
  /** False when the HSM is not ready; the login shows a warning instead of the form. */
  hsmReady: boolean;
  /** The path the UI is served from, "" at the root (the legacy `instanceUrl`). */
  instanceUrl: string;
  /** Heading from the `login_text` policy; empty for "Please sign in". */
  loginText: string;
  /** Logo file name below `static/css/` (`EDUMFA_LOGO`). */
  logo: string;
  /** Show the "Reset Password" link (a password reset policy exists). */
  passwordReset: boolean;
  /** Realms of the `realm_dropdown` policy, sorted; empty hides the dropdown. */
  realms: string[];
  /** User authenticated by the web server (`REMOTE_USER`), if allowed by policy. */
  remoteUser: string;
  /** Node name to show in the navigation (`show_node` policy). */
  showNode: string;
}

const defaultUiConfig: UiConfig = {
  browserLanguage: "en",
  customizationPath: "static/customize",
  externalLinks: true,
  forceRemoteUser: false,
  gdprLink: "",
  hasJobQueue: false,
  hsmReady: true,
  instanceUrl: "",
  loginText: "",
  logo: "",
  passwordReset: false,
  realms: [],
  remoteUser: "",
  showNode: ""
};

let cachedConfig: UiConfig | null = null;

/** The page configuration, read on first use. */
export function getUiConfig(): UiConfig {
  cachedConfig ??= readUiConfig();

  return cachedConfig;
}

/** Forgets the cached configuration (tests change the document between cases). */
export function resetUiConfigCache(): void {
  cachedConfig = null;
}

/**
 * Reads the JSON block `#edumfa-ui-config` the template renders; the
 * hidden inputs of the legacy template serve as fallback.
 */
export function readUiConfig(
  documentRef: Document = document,
  pathname: string = window.location.pathname
): UiConfig {
  const instanceUrl = getInstanceUrl(pathname);
  const script = documentRef.getElementById("edumfa-ui-config");

  if (script instanceof HTMLScriptElement && script.textContent) {
    try {
      return normalizeUiConfig(
        JSON.parse(script.textContent) as Record<string, unknown>,
        instanceUrl
      );
    } catch {
      // fall through to the hidden inputs
    }
  }

  const read = (id: string): string => {
    const element = documentRef.getElementById(id);

    return element instanceof HTMLInputElement ? element.value : "";
  };

  return normalizeUiConfig(
    {
      browser_lang: typeof window === "undefined" ? undefined : window.browserLanguage,
      customization: read("CUSTOMIZATION"),
      external_links: read("EXTERNAL_LINKS"),
      force_remote_user: read("FORCE_REMOTE_USER"),
      gdpr_link: read("GDPR_LINK"),
      has_job_queue: read("HAS_JOB_QUEUE"),
      hsm_ready: read("HSM_READY") || "True",
      login_text: read("LOGIN_TEXT"),
      logo: read("LOGO"),
      password_reset: read("PASSWORD_RESET"),
      realms: read("REALMS"),
      remote_user: read("REMOTE_USER"),
      show_node: read("SHOW_NODE")
    },
    instanceUrl
  );
}

/** The legacy `instanceUrl` constant: the path the UI is served from, "" at the root. */
export function getInstanceUrl(pathname: string = window.location.pathname): string {
  return pathname.replace(/\/+$/, "");
}

function normalizeUiConfig(
  raw: Record<string, unknown>,
  instanceUrl: string
): UiConfig {
  return {
    browserLanguage: toText(raw.browser_lang) || defaultUiConfig.browserLanguage,
    customizationPath: toText(raw.customization) || defaultUiConfig.customizationPath,
    externalLinks:
      toText(raw.external_links) !== "False" && raw.external_links !== false,
    forceRemoteUser: toFlag(raw.force_remote_user),
    gdprLink: toText(raw.gdpr_link),
    hasJobQueue: toFlag(raw.has_job_queue),
    hsmReady: toText(raw.hsm_ready) !== "False" && raw.hsm_ready !== false,
    instanceUrl,
    loginText: toText(raw.login_text),
    logo: toText(raw.logo),
    passwordReset: toFlag(raw.password_reset),
    realms: toRealmList(raw.realms),
    remoteUser: toText(raw.remote_user),
    showNode: toText(raw.show_node)
  };
}

function toText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

/** Jinja renders Python booleans as "True"/"False"; JSON delivers real booleans. */
function toFlag(value: unknown): boolean {
  return value === true || value === "True" || value === "true";
}

function toRealmList(value: unknown): string[] {
  const entries = Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : toText(value).split(",");

  return entries
    .map((realm) => realm.trim())
    .filter((realm) => realm.length > 0)
    .sort();
}
