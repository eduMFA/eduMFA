import type { TokenDetail } from "../api/tokens";

/**
 * Port of the legacy global `fixSerial`. Serial suggestions are presented as
 * "SERIAL (type) [description]", so everything from the first " (" on is
 * stripped before the serial is sent to the API.
 */
export function fixSerial(serial: string | null | undefined): string {
  if (!serial) {
    return "";
  }

  const match = /^(.*) \(.*\).*$/.exec(serial);

  return match?.[1] ?? serial;
}

export interface SerialSuggestionOptions {
  /** Append "[user@realm]" like the legacy attach-token directive did. */
  includeUser?: boolean;
}

/**
 * Formats a token the way the legacy typeahead directives did, so that
 * `fixSerial` can recover the serial from the selected suggestion.
 */
export function formatSerialSuggestion(
  token: Pick<
    TokenDetail,
    "description" | "realms" | "serial" | "tokentype" | "username"
  >,
  { includeUser = false }: SerialSuggestionOptions = {}
): string {
  let suggestion = `${token.serial} (${token.tokentype}) `;

  if (includeUser && token.username) {
    suggestion += `[${token.username}@${token.realms.join(",")}] `;
  }

  if (token.description) {
    suggestion += `[${token.description}] `;
  }

  return suggestion;
}
