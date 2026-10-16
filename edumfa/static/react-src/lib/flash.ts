export type FlashType = "danger" | "info" | "success" | "warning";

export interface FlashMessage {
  message: string;
  type: FlashType;
}

let pendingFlash: FlashMessage | null = null;

/**
 * One-off notice for the next page, replacing the legacy growl notification
 * that outlived an Angular state change. Navigation happens through the
 * hash, which cannot carry history state, so the notice is parked here
 * until the target page picks it up.
 */
export function pushFlash(message: string, type: FlashType = "info"): void {
  pendingFlash = { message, type };
}

export function popFlash(): FlashMessage | null {
  const flash = pendingFlash;

  pendingFlash = null;

  return flash;
}
