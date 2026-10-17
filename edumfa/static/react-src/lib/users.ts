import type { UserDetail } from "@/api/users";

/**
 * Formats a user the way the legacy assign-user typeahead did:
 * "[<userid>] <username> (<givenname> <surname>)", so `fixUser` can read
 * the login name back.
 */
export function formatUserSuggestion(user: UserDetail): string {
  return `[${user.userid}] ${user.username} (${user.givenname ?? ""} ${user.surname ?? ""})`;
}

/** Port of the legacy global `fixUser`: strips the suggestion decoration. */
export function fixUser(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const match = /^\[.*\] (.+?(?= \()) \(.*\).*$/.exec(value);

  return match?.[1] ?? value;
}
