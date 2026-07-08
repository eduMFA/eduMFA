import { i18n } from "@lingui/core";

import { messages as deMessages } from "../locales/de/messages";
import { messages as enMessages } from "../locales/en/messages";

const catalogs = {
  de: deMessages,
  en: enMessages
} as const;
const sourceLocale: SupportedLocale = "en";

type SupportedLocale = keyof typeof catalogs;

export { i18n };

export function activateDefaultLocale(): void {
  const browserLocale =
    typeof window === "undefined" ? undefined : window.browserLanguage;
  const locale = getSupportedLocale(browserLocale);

  i18n.load(locale, catalogs[locale]);
  i18n.activate(locale);
}

function getSupportedLocale(locale: string | undefined): SupportedLocale {
  const normalizedLocale = locale?.replace("_", "-").toLowerCase();

  if (normalizedLocale?.startsWith("de")) {
    return "de";
  }

  return sourceLocale;
}

activateDefaultLocale();
