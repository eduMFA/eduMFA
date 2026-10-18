import { useLingui } from "@lingui/react/macro";
import { Checkbox, Divider, TextInput } from "@mantine/core";
import type { UseFormRegister } from "react-hook-form";

import type { MicrosoftCaFormValues } from "./microsoftCaForm";

export interface MicrosoftCaBaseFieldsProps {
  register: UseFormRegister<MicrosoftCaFormValues>;
}

/** The "Base Config" section: the worker's hostname, port and proxy flag. */
export function MicrosoftCaBaseFields({ register }: MicrosoftCaBaseFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <Divider label={t`Base Config`} labelPosition="left" my="md" />

      <TextInput
        id="hostname"
        label={t`Microsoft CA worker hostname`}
        mb="md"
        placeholder="example.net"
        required
        {...register("hostname", { required: true })}
      />
      <TextInput
        id="port"
        inputMode="numeric"
        label={t`Microsoft CA worker port`}
        mb="md"
        placeholder="1234"
        required
        {...register("port", { required: true })}
      />
      <Checkbox
        id="http_proxy"
        label={t`Use HTTP proxy`}
        mb="md"
        {...register("http_proxy")}
      />
    </>
  );
}
