import { useState } from "react";

import {
  createSmsGatewayValues,
  type SmsGatewayEntryGroup,
  type SmsGatewayFieldSetter
} from "./smsGatewayValues";
import type { SmsGateway, SmsProviders } from "@/api/servers";

/** The form state of an SMS gateway: the plain fields and the name/value groups. */
export function useSmsGatewayValues(
  existing: SmsGateway | undefined,
  providers: SmsProviders
) {
  const [values, setValues] = useState(() =>
    createSmsGatewayValues(existing, providers)
  );

  const setValue: SmsGatewayFieldSetter = (key, value) => {
    setValues((previous) => ({ ...previous, [key]: value }));
  };

  const setEntry = (key: SmsGatewayEntryGroup, name: string, value: string) => {
    setValues((previous) => ({
      ...previous,
      [key]: { ...previous[key], [name]: value }
    }));
  };

  const deleteEntry = (key: "headers" | "options", name: string) => {
    setValues((previous) => ({
      ...previous,
      [key]: Object.fromEntries(
        Object.entries(previous[key]).filter(([entryName]) => entryName !== name)
      )
    }));
  };

  return { deleteEntry, setEntry, setValue, values };
}
