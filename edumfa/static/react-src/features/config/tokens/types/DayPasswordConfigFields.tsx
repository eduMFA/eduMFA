import { useLingui } from "@lingui/react/macro";
import { NativeSelect, Stack, Text, TextInput } from "@mantine/core";

import { HelpText } from "./HelpText";
import type { TokenConfigFieldsProps } from "./types";
import {
  fixedOptions,
  getText,
  hashlibs
} from "@/features/config/tokens/tokenConfigForm";

/** Port of `config.token.daypassword.html`. */
export function DayPasswordConfigFields({ form, onChange }: TokenConfigFieldsProps) {
  const { t } = useLingui();

  const hashlib = getText(form, "daypassword.hashlib");

  return (
    <>
      <HelpText>
        {t`The DayPassword Token is a time based password token. It is based on the TOTP token, but it can be used more than once.`}
      </HelpText>
      <Text mb="md" size="sm">
        {t`Here you can define settings, that will be set as default values, when enrolling a DayPassword token.`}
      </Text>
      <Stack gap="sm">
        <TextInput
          id="daypasswordStep"
          inputMode="numeric"
          label={t`Default Time Step`}
          onChange={(event) => {
            onChange({ "daypassword.timeStep": event.currentTarget.value });
          }}
          placeholder="60"
          required
          value={getText(form, "daypassword.timeStep")}
        />
        <NativeSelect
          data={fixedOptions(hashlibs, hashlib)}
          id="daypasswordHashlib"
          label={t`Default Hashlib`}
          onChange={(event) => {
            onChange({ "daypassword.hashlib": event.currentTarget.value });
          }}
          value={hashlib}
        />
      </Stack>
    </>
  );
}
