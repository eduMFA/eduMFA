export interface LoginPageConfig {
  /** `remote_user=force`: credentials login is not offered. */
  forceRemoteUser: boolean;
  /** False when the HSM is not ready; the legacy view showed a warning instead of the form. */
  hsmReady: boolean;
  /** Heading from the `login_text` policy; empty for "Please sign in". */
  loginText: string;
  logoUrl: string | null;
  /** Show the "Reset Password" link (a password reset policy exists). */
  passwordReset: boolean;
  /** Realms of the `realm_dropdown` policy, sorted; empty hides the dropdown. */
  realms: string[];
  /** User authenticated by the web server (`REMOTE_USER`), if allowed by policy. */
  remoteUser: string;
}

/**
 * Settings the Flask view renders into hidden inputs of `index.html`
 * (`webui/login.py`): the web server user, the realm dropdown, the HSM state
 * and the login customisation. The legacy `mainController` read the same
 * inputs with jQuery.
 */
export function readLoginPageConfig(
  documentRef: Document = document,
  pathname: string = window.location.pathname
): LoginPageConfig {
  const read = (id: string): string => {
    const element = documentRef.getElementById(id);

    return element instanceof HTMLInputElement ? element.value : "";
  };
  const logo = read("LOGO");

  return {
    forceRemoteUser: read("FORCE_REMOTE_USER") === "True",
    hsmReady: read("HSM_READY") !== "False",
    loginText: read("LOGIN_TEXT"),
    logoUrl: logo ? `${getInstanceUrl(pathname)}/static/css/${logo}` : null,
    passwordReset: read("PASSWORD_RESET") === "True",
    realms: read("REALMS")
      .split(",")
      .map((realm) => realm.trim())
      .filter((realm) => realm.length > 0)
      .sort(),
    remoteUser: read("REMOTE_USER")
  };
}

/** The legacy `instanceUrl` constant: the path the UI is served from, "" at the root. */
export function getInstanceUrl(pathname: string = window.location.pathname): string {
  return pathname.replace(/\/+$/, "");
}
