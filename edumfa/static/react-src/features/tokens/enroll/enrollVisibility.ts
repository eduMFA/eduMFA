import { pinlessTypes, type EnrollMode } from "./enrollForm";
import type { WebUiSettings } from "@/auth/AuthProvider";
import { getRightsValue, hasRight } from "@/auth/permissions";

/** Which optional sections the enrollment form shows for this session and type. */
export interface EnrollVisibility {
  /** `require_description` names the selected type. */
  descriptionRequired: boolean;
  /** The wizard without a seed shows a larger QR code. */
  qrCodeWidth: number;
  showDescription: boolean;
  showExtendedAttributes: boolean;
  showPin: boolean;
  showTypeSelect: boolean;
  showUserAssignment: boolean;
}

export interface EnrollVisibilityContext {
  mode: EnrollMode;
  rights: readonly string[];
  role: string;
  settings: Pick<WebUiSettings, "requireDescription" | "showSeed">;
  /** The resolved token type. */
  type: string;
}

/** Port of the `ng-show`/`ng-hide` conditions of `token.enroll.html`. */
export function getEnrollVisibility({
  mode,
  rights,
  role,
  settings,
  type
}: EnrollVisibilityContext): EnrollVisibility {
  const isAdmin = role === "admin";
  const isUser = role === "user";
  const isRollover = mode === "rollover";
  const isWizard = mode === "wizard";

  return {
    descriptionRequired: settings.requireDescription.includes(type),
    qrCodeWidth: isWizard && !settings.showSeed ? 300 : 250,
    showDescription: !(isUser && !hasRight(rights, "setdescription")),
    showExtendedAttributes: isAdmin && !isWizard,
    showPin:
      isUser &&
      !pinlessTypes.has(type) &&
      !isRollover &&
      (!isWizard || getRightsValue(rights, "otp_pin_minlength") !== false) &&
      hasRight(rights, "enrollpin"),
    showTypeSelect: !isRollover && !isWizard,
    showUserAssignment: isAdmin && !isRollover
  };
}
