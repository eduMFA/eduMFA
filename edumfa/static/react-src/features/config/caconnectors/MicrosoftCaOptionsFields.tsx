import { Trans } from "@lingui/react/macro";
import { Button, Divider, NativeSelect } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import {
  useWatch,
  type Control,
  type UseFormGetValues,
  type UseFormRegister
} from "react-hook-form";

import type { MicrosoftCaFormValues } from "./microsoftCaForm";
import { useMicrosoftCaOptions } from "./useMicrosoftCaOptions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";

export interface MicrosoftCaOptionsFieldsProps {
  control: Control<MicrosoftCaFormValues>;
  getValues: UseFormGetValues<MicrosoftCaFormValues>;
  isEditing: boolean;
  register: UseFormRegister<MicrosoftCaFormValues>;
}

/** The "CA specific options" section: asks the worker for its CAs and offers them. */
export function MicrosoftCaOptionsFields({
  control,
  getValues,
  isEditing,
  register
}: MicrosoftCaOptionsFieldsProps) {
  const caValue = useWatch({ control, name: "ca" });
  const hostname = useWatch({ control, name: "hostname" });
  const port = useWatch({ control, name: "port" });
  const options = useMicrosoftCaOptions({ caValue, getValues, isEditing });

  return (
    <>
      <Divider
        label={<Trans>CA specific options</Trans>}
        labelPosition="left"
        my="md"
      />

      <Button
        color="green"
        disabled={hostname === "" || port === ""}
        leftSection={<IconDownload size={16} />}
        loading={options.isFetching}
        mb="md"
        onClick={options.request}
        variant="light"
      >
        <Trans>Get available CAs</Trans>
      </Button>

      <ErrorAlert error={options.error} />

      {options.showCaSelect ? (
        <NativeSelect
          data={options.caOptions}
          id="available_cas"
          label={<Trans>Domain CA</Trans>}
          required
          {...register("ca", { required: true })}
        />
      ) : null}
    </>
  );
}
