import { useLingui } from "@lingui/react/macro";
import { NativeSelect, TextInput } from "@mantine/core";

import { type SerialLookupFieldName, type SerialLookupFields } from "./types";

/**
 * Searchable token types, as hard-coded in the legacy controller. The
 * descriptions are product names and were never translated there either.
 */
const tokenTypeOptions = [
  { label: "HOTP: event based One Time Passwords", value: "hotp" },
  { label: "TOTP: time based One Time Passwords", value: "totp" },
  { label: "SPass: Simple Pass token. Static passwords", value: "spass" },
  { label: "mOTP: classical mobile One Time Passwords", value: "motp" },
  { label: "SSH Public Key: The public SSH key", value: "sshkey" },
  { label: "Yubikey AES mode: One Time Passwords with Yubikey", value: "yubikey" },
  {
    label: "Remote Token: Forward authentication request to another server",
    value: "remote"
  },
  {
    label: "Yubikey Cloud mode: Forward authentication request to YubiCloud",
    value: "yubico"
  },
  {
    label: "RADIUS: Forward authentication request to a RADIUS server",
    value: "radius"
  },
  { label: "SMS: Send a One Time Password to the users mobile phone", value: "sms" }
];

export interface SerialLookupFiltersProps {
  fields: SerialLookupFields;
  inputsDisabled: boolean;
  onFieldChange: (name: SerialLookupFieldName, value: string) => void;
}

/** The optional parameters that narrow the search down. */
export function SerialLookupFilters({
  fields,
  inputsDisabled,
  onFieldChange
}: SerialLookupFiltersProps) {
  const { t } = useLingui();

  return (
    <>
      <NativeSelect
        data={[{ label: t`Any token type`, value: "" }, ...tokenTypeOptions]}
        disabled={inputsDisabled}
        id="tokentype"
        label={t`Token Type`}
        mb="sm"
        onChange={(event) => {
          onFieldChange("tokenType", event.currentTarget.value);
        }}
        value={fields.tokenType}
      />
      <NativeSelect
        data={[
          {
            label: t`It does not matter, if the token is assigned or not`,
            value: ""
          },
          { label: t`The token is assigned to a user`, value: "assigned" },
          { label: t`The token is not assigned to a user`, value: "unassigned" }
        ]}
        disabled={inputsDisabled}
        id="assigned"
        label={t`Assignment State`}
        mb="sm"
        onChange={(event) => {
          onFieldChange("assignment", event.currentTarget.value);
        }}
        value={fields.assignment}
      />
      <TextInput
        disabled={inputsDisabled}
        id="serial"
        label={t`Serial Substring`}
        mb="sm"
        onChange={(event) => {
          onFieldChange("serialSubstring", event.currentTarget.value);
        }}
        placeholder={t`an optional serial substring`}
        value={fields.serialSubstring}
      />
      <TextInput
        disabled={inputsDisabled}
        id="window"
        inputMode="numeric"
        label={t`Count Window`}
        min={1}
        onChange={(event) => {
          onFieldChange("countWindow", event.currentTarget.value);
        }}
        placeholder={t`The number of lookahead OTP values. Default 10.`}
        type="number"
        value={fields.countWindow}
      />
    </>
  );
}
