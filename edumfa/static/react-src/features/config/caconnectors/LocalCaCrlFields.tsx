import { useLingui } from "@lingui/react/macro";
import { Divider, Grid, TextInput } from "@mantine/core";
import type { UseFormRegister } from "react-hook-form";

import type { LocalCaFormValues } from "./localCaForm";

export interface LocalCaCrlFieldsProps {
  register: UseFormRegister<LocalCaFormValues>;
}

/** The "CRL Configuration" section: the CRL file and its validity periods. */
export function LocalCaCrlFields({ register }: LocalCaCrlFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <Divider label={t`CRL Configuration`} labelPosition="left" my="md" />

      <TextInput
        description={t`This is the CRL file, which is written when a certificate is revoked or the CRL is created otherwise.`}
        id="crl"
        label={t`Certificate Revocation List`}
        mb="md"
        placeholder="/opt/myCA/certs/crl.pem"
        {...register("CRL")}
      />
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <TextInput
            description={t`Number of days the generated CRL should be valid.`}
            id="validity_period"
            inputMode="numeric"
            label={t`Validity Period`}
            placeholder="30"
            {...register("CRL_Validity_Period")}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <TextInput
            description={t`Number of days a new CRL should be generated before the current CRL expires.`}
            id="overlap_period"
            inputMode="numeric"
            label={t`Overlap Period`}
            placeholder="10"
            {...register("CRL_Overlap_Period")}
          />
        </Grid.Col>
      </Grid>
    </>
  );
}
