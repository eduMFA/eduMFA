import { Trans } from "@lingui/react/macro";
import { Divider, Grid, TextInput } from "@mantine/core";
import type { UseFormRegister } from "react-hook-form";

import type { LocalCaFormValues } from "./localCaForm";

export interface LocalCaCrlFieldsProps {
  register: UseFormRegister<LocalCaFormValues>;
}

/** The "CRL Configuration" section: the CRL file and its validity periods. */
export function LocalCaCrlFields({ register }: LocalCaCrlFieldsProps) {
  return (
    <>
      <Divider label={<Trans>CRL Configuration</Trans>} labelPosition="left" my="md" />

      <TextInput
        description={
          <Trans>
            This is the CRL file, which is written when a certificate is revoked or the
            CRL is created otherwise.
          </Trans>
        }
        id="crl"
        label={<Trans>Certificate Revocation List</Trans>}
        mb="md"
        placeholder="/opt/myCA/certs/crl.pem"
        {...register("CRL")}
      />
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <TextInput
            description={
              <Trans>Number of days the generated CRL should be valid.</Trans>
            }
            id="validity_period"
            inputMode="numeric"
            label={<Trans>Validity Period</Trans>}
            placeholder="30"
            {...register("CRL_Validity_Period")}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <TextInput
            description={
              <Trans>
                Number of days a new CRL should be generated before the current CRL
                expires.
              </Trans>
            }
            id="overlap_period"
            inputMode="numeric"
            label={<Trans>Overlap Period</Trans>}
            placeholder="10"
            {...register("CRL_Overlap_Period")}
          />
        </Grid.Col>
      </Grid>
    </>
  );
}
