/**
 * Formats a server timestamp the way the legacy Angular date filter did with
 * "yyyy-MM-dd HH:mm:ss": parsed by the browser and rendered in local time.
 * Unparseable values are returned unchanged.
 */
export function formatLegacyDate(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = String(date.getFullYear());
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());
  const hours = padDatePart(date.getHours());
  const minutes = padDatePart(date.getMinutes());
  const seconds = padDatePart(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Token validity periods are stored as `YYYY-MM-DDTHH:mm+HHMM` (the backend
 * `DATE_FORMAT`). `Date.parse` needs a colon in the offset, which is added
 * here; the legacy day-first spelling `DD/MM/YYYY ...` is handled as well.
 */
export function parseValidityPeriod(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  let normalized = value.trim();

  if (normalized.charAt(2) === "/") {
    normalized = `${normalized.slice(3, 5)}/${normalized.slice(0, 2)}/${normalized.slice(6)}`;
  }

  normalized = normalized.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");

  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Port of the legacy `date_object_to_string`: local wall-clock time with the
 * numeric UTC offset, e.g. `2026-10-17T10:30+0200`.
 */
export function formatValidityPeriod(date: Date | null | undefined): string {
  if (!date) {
    return "";
  }

  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes < 0 ? "-" : "+";
  const absOffset = Math.abs(offsetMinutes);
  const offset = `${sign}${padDatePart(Math.floor(absOffset / 60))}${padDatePart(absOffset % 60)}`;

  return `${String(date.getFullYear())}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}${offset}`;
}
