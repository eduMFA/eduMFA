import { Trans } from "@lingui/react/macro";
import { Divider, TextInput } from "@mantine/core";
import type { UseFormRegister } from "react-hook-form";

import type { LocalCaFormValues } from "./localCaForm";

export interface LocalCaBaseFieldsProps {
  register: UseFormRegister<LocalCaFormValues>;
}

/** The "Base Config" section: the CA files and the working directories. */
export function LocalCaBaseFields({ register }: LocalCaBaseFieldsProps) {
  return (
    <>
      <Divider label={<Trans>Base Config</Trans>} labelPosition="left" my="md" />

      <TextInput
        id="cacert"
        label={<Trans>CA Certificate</Trans>}
        mb="md"
        placeholder="/etc/cacert.pem"
        required
        {...register("cacert", { required: true })}
      />
      <TextInput
        id="cakey"
        label={<Trans>CA Key</Trans>}
        mb="md"
        placeholder="/etc/cakey.pem"
        required
        {...register("cakey", { required: true })}
      />
      <TextInput
        id="openssl.cnf"
        label={<Trans>OpenSSL config file</Trans>}
        mb="md"
        placeholder="/etc/openssl.cnf"
        required
        {...register("opensslCnf", { required: true })}
      />
      <TextInput
        id="templates"
        label={<Trans>Certificates Templates file</Trans>}
        mb="md"
        placeholder="/etc/edumfa/ca/templates.yaml"
        {...register("templates")}
      />
      <TextInput
        id="workingdir"
        label={<Trans>Working Directory</Trans>}
        mb="md"
        placeholder="/opt/myCA"
        {...register("WorkingDir")}
      />
      <TextInput
        id="csrdir"
        label={<Trans>Certificate Signing Request Directory</Trans>}
        mb="md"
        placeholder="/opt/myCA/csrs"
        {...register("CSRDir")}
      />
      <TextInput
        description={
          <Trans>This is the directory were certificates get written to.</Trans>
        }
        id="certdir"
        label={<Trans>Certificate Directory</Trans>}
        mb="md"
        placeholder="/opt/myCA/certs"
        {...register("CertificateDir")}
      />
    </>
  );
}
