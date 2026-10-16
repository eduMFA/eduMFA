import { notifications } from "@mantine/notifications";

import type { FlashType } from "./flash";

const notificationColors: Record<FlashType, string> = {
  danger: "red",
  info: "blue",
  success: "green",
  warning: "yellow"
};

/** Toast notification, the modern counterpart of the legacy `inform` growls. */
export function notify(message: string, type: FlashType = "info"): void {
  notifications.show({ color: notificationColors[type], message, withBorder: true });
}
