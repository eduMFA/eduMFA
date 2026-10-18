import { Trans } from "@lingui/react/macro";
import { Checkbox, Divider, TextInput } from "@mantine/core";
import type { UseFormRegister } from "react-hook-form";

import type { MicrosoftCaFormValues } from "./microsoftCaForm";

export interface MicrosoftCaBaseFieldsProps {
  register: UseFormRegister<MicrosoftCaFormValues>;
}

/** The "Base Config" section: the worker's hostname, port and proxy flag. */
export function MicrosoftCaBaseFields({ register }: MicrosoftCaBaseFieldsProps) {
  return (
    <>
      <Divider label={<Trans>Base Config</Trans>} labelPosition="left" my="md" />

      <TextInput
        id="hostname"
        label={<Trans>Microsoft CA worker hostname</Trans>}
        mb="md"
        placeholder="example.net"
        required
        {...register("hostname", { required: true })}
      />
      <TextInput
        id="port"
        inputMode="numeric"
        label={<Trans>Microsoft CA worker port</Trans>}
        mb="md"
        placeholder="1234"
        required
        {...register("port", { required: true })}
      />
      <Checkbox
        id="http_proxy"
        label={<Trans>Use HTTP proxy</Trans>}
        mb="md"
        {...register("http_proxy")}
      />
    </>
  );
}
