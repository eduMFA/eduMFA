import { useLingui } from "@lingui/react/macro";
import { NativeSelect, PasswordInput, Stack, TextInput } from "@mantine/core";

import { type PskcValidateMac } from "@/api/tokens";

export interface PskcOptionsProps {
  password: string;
  psk: string;
  setPassword: (password: string) => void;
  setPsk: (psk: string) => void;
  setValidateMac: (validateMac: PskcValidateMac | "") => void;
  validateMac: PskcValidateMac | "";
}

/**
 * The PSKC decryption secret (either a pre shared key or a password) and
 * how the MAC of the imported tokens is verified.
 */
export function PskcOptions({
  password,
  psk,
  setPassword,
  setPsk,
  setValidateMac,
  validateMac
}: PskcOptionsProps) {
  const { t } = useLingui();
  const validateMacOptions = [
    { label: "", value: "" },
    { label: t`Do not verify the authenticity`, value: "no_check" },
    { label: t`Skip tokens that can not be verified`, value: "check_fail_soft" },
    { label: t`Abort operation on unverifiable token`, value: "check_fail_hard" }
  ];

  return (
    <Stack gap="sm" mb="sm">
      <TextInput
        id="psk"
        label={t`Pre Shared Key`}
        maxLength={32}
        onChange={(event) => {
          setPsk(event.currentTarget.value);
          setPassword("");
        }}
        placeholder={t`Pre Shared Key`}
        value={psk}
      />
      <PasswordInput
        id="pskcPassword"
        label={t`Password`}
        onChange={(event) => {
          setPassword(event.currentTarget.value);
          setPsk("");
        }}
        placeholder={t`Password`}
        value={password}
      />
      <NativeSelect
        data={validateMacOptions}
        description={t`You can choose how the authenticity of the tokens to be imported should be verified.`}
        id="pskcValidateMAC"
        label={t`Verification`}
        onChange={(event) => {
          setValidateMac(event.currentTarget.value as PskcValidateMac | "");
        }}
        value={validateMac}
      />
    </Stack>
  );
}
