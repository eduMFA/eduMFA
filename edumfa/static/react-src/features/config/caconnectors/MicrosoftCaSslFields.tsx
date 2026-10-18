import { Trans, useLingui } from "@lingui/react/macro";
import { Checkbox, Divider, PasswordInput, Stack, TextInput } from "@mantine/core";
import { useWatch, type Control, type UseFormRegister } from "react-hook-form";

import type { MicrosoftCaFormValues } from "./microsoftCaForm";

export interface MicrosoftCaSslFieldsProps {
  control: Control<MicrosoftCaFormValues>;
  register: UseFormRegister<MicrosoftCaFormValues>;
}

/** The "SSL Config" section; the certificate inputs follow the "Use SSL" flag. */
export function MicrosoftCaSslFields({ control, register }: MicrosoftCaSslFieldsProps) {
  const { t } = useLingui();
  const useSsl = useWatch({ control, name: "use_ssl" });

  return (
    <>
      <Divider label={<Trans>SSL Config</Trans>} labelPosition="left" my="md" />

      <Checkbox
        id="use_ssl"
        label={<Trans>Use SSL</Trans>}
        mb="md"
        {...register("use_ssl")}
      />
      {useSsl ? (
        <Stack gap="md" mb="md">
          <TextInput
            id="ssl_ca_cert"
            label={<Trans>CA certificate (filename)</Trans>}
            placeholder="/etc/edumfa/ca/ca.crt"
            {...register("ssl_ca_cert")}
          />
          <TextInput
            id="ssl_client_cert"
            label={<Trans>Client certificate (filename)</Trans>}
            placeholder="/etc/edumfa/ca/edumfa.crt"
            {...register("ssl_client_cert")}
          />
          <TextInput
            id="ssl_client_key"
            label={<Trans>Client private key (filename)</Trans>}
            placeholder="/etc/edumfa/ca/edumfa.key"
            {...register("ssl_client_key")}
          />
          <PasswordInput
            autoComplete="new-password"
            id="ssl_client_key_password"
            label={<Trans>Password of encrypted client private key</Trans>}
            placeholder={t`top secret`}
            {...register("ssl_client_key_password")}
          />
        </Stack>
      ) : null}
    </>
  );
}
