import { useLingui } from "@lingui/react/macro";

import { U2fApiError, U2fUnavailableError } from "./u2f";
import { WebAuthnUnavailableError } from "./webauthn";

export type FidoCeremony = "authentication" | "registration";

/**
 * Human readable message for a failed U2F / WebAuthn ceremony: the legacy
 * `u2fErrors` list by error code, and a translation of the `DOMException`
 * names `navigator.credentials` rejects with. Registration (enrollment) and
 * authentication (login) word the messages differently.
 */
export function useFidoErrorMessage(
  ceremony: FidoCeremony = "registration"
): (error: unknown) => string {
  const { t } = useLingui();
  const registering = ceremony === "registration";

  const describeDomException = (name: string): string => {
    switch (name) {
      case "AbortError":
        return registering
          ? t`The registration was aborted.`
          : t`The authentication was aborted.`;
      case "InvalidStateError":
        return registering
          ? t`The authenticator is already registered.`
          : t`The authenticator is in an invalid state.`;
      case "NotAllowedError":
        return registering
          ? t`The registration was cancelled or timed out.`
          : t`The authentication was cancelled or timed out.`;
      case "NotSupportedError":
        return t`The authenticator does not support the requested options.`;
      case "SecurityError":
        return t`The relying party ID does not match this site.`;
      default:
        return name;
    }
  };

  return (error: unknown): string => {
    if (error instanceof U2fApiError) {
      const messages = [
        t`OK`,
        t`Other Error`,
        t`Bad U2F Request`,
        t`Client Configuration is not supported.`,
        t`The client device can not be used for this type of request.`,
        t`Timeout while waiting for signing response.`
      ];

      return `${messages[error.errorCode] ?? messages[1] ?? ""} / ${error.message}`;
    }

    if (error instanceof U2fUnavailableError) {
      return t`The U2F API is not available in this browser.`;
    }

    if (error instanceof WebAuthnUnavailableError) {
      return t`WebAuthn is not supported by this browser, or in this context.`;
    }

    if (error instanceof DOMException) {
      return `${describeDomException(error.name)} / ${error.message}`;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return registering ? t`The registration failed.` : t`The authentication failed.`;
  };
}
