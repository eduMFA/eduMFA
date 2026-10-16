import type { I18n, MessageDescriptor } from "@lingui/core";
import { msg } from "@lingui/core/macro";

/**
 * Labels for the attribute names a user resolver can expose. The legacy view
 * passed the raw attribute name through `gettextCatalog.getString`; unknown
 * names fall back to the name itself here as well.
 */
const userFieldLabels: Record<string, MessageDescriptor> = {
  description: msg`description`,
  email: msg`email`,
  givenname: msg`givenname`,
  mobile: msg`mobile`,
  password: msg`password`,
  phone: msg`phone`,
  surname: msg`surname`,
  userid: msg`id`,
  username: msg`username`
};

export function getUserFieldLabel(i18n: I18n, fieldName: string): string {
  const descriptor = userFieldLabels[fieldName];

  return descriptor ? i18n._(descriptor) : fieldName;
}
