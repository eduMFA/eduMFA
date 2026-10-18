import { useLingui } from "@lingui/react/macro";
import { Divider, TextInput } from "@mantine/core";
import type { UseFormRegister } from "react-hook-form";

import type { LocalCaFormValues } from "./localCaForm";

export interface LocalCaBaseFieldsProps {
  register: UseFormRegister<LocalCaFormValues>;
}

/** The "Base Config" section: the CA files and the working directories. */
export function LocalCaBaseFields({ register }: LocalCaBaseFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <Divider label={t`Base Config`} labelPosition="left" my="md" />

      <TextInput
        id="cacert"
        label={t`CA Certificate`}
        mb="md"
        placeholder="/etc/cacert.pem"
        required
        {...register("cacert", { required: true })}
      />
      <TextInput
        id="cakey"
        label={t`CA Key`}
        mb="md"
        placeholder="/etc/cakey.pem"
        required
        {...register("cakey", { required: true })}
      />
      <TextInput
        id="openssl.cnf"
        label={t`OpenSSL config file`}
        mb="md"
        placeholder="/etc/openssl.cnf"
        required
        {...register("opensslCnf", { required: true })}
      />
      <TextInput
        id="templates"
        label={t`Certificates Templates file`}
        mb="md"
        placeholder="/etc/edumfa/ca/templates.yaml"
        {...register("templates")}
      />
      <TextInput
        id="workingdir"
        label={t`Working Directory`}
        mb="md"
        placeholder="/opt/myCA"
        {...register("WorkingDir")}
      />
      <TextInput
        id="csrdir"
        label={t`Certificate Signing Request Directory`}
        mb="md"
        placeholder="/opt/myCA/csrs"
        {...register("CSRDir")}
      />
      <TextInput
        description={t`This is the directory were certificates get written to.`}
        id="certdir"
        label={t`Certificate Directory`}
        mb="md"
        placeholder="/opt/myCA/certs"
        {...register("CertificateDir")}
      />
    </>
  );
}
