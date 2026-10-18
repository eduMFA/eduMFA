import type { AuditEntry } from "@/api/audit";

export interface FailedUser {
  fails: number;
  latestError: string;
  realm: string;
  user: string;
}

export interface FailureSummary {
  serials: string[];
  users: FailedUser[];
}

/**
 * Groups the failed authentications by user (newest failure first) and
 * collects the serials of failures without a user, like the legacy
 * controller.
 */
export function summarizeFailures(entries: readonly AuditEntry[]): FailureSummary {
  const users = new Map<string, FailedUser>();
  const serials: string[] = [];

  for (const entry of entries) {
    if (!entry.user) {
      if (entry.serial) {
        serials.push(entry.serial);
      }

      continue;
    }

    const realm = entry.realm ?? "";
    const key = `${entry.user}-${realm}`;
    const known = users.get(key);

    if (known) {
      known.fails += 1;

      if (entry.date > known.latestError) {
        known.latestError = entry.date;
      }
    } else {
      users.set(key, { fails: 1, latestError: entry.date, realm, user: entry.user });
    }
  }

  return {
    serials,
    users: [...users.values()].sort((left, right) =>
      right.latestError.localeCompare(left.latestError)
    )
  };
}
