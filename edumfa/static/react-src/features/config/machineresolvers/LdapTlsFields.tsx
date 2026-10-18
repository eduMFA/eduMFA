import { Trans } from "@lingui/react/macro";
import { Box, Checkbox, TextInput } from "@mantine/core";
import { useWatch, type Control, type UseFormRegister } from "react-hook-form";

import {
  offersStartTls,
  offersTlsVerify,
  type LdapMachineResolverFormValues
} from "./ldapMachineResolverValues";

export interface LdapTlsFieldsProps {
  control: Control<LdapMachineResolverFormValues>;
  register: UseFormRegister<LdapMachineResolverFormValues>;
}

/**
 * STARTTLS and the TLS verification. They follow the URI like the legacy
 * `ng-show` conditions; hidden values stay in the payload.
 */
export function LdapTlsFields({ control, register }: LdapTlsFieldsProps) {
  const ldapUri = useWatch({ control, name: "LDAPURI" });
  const startTls = useWatch({ control, name: "START_TLS" });
  const tlsVerify = useWatch({ control, name: "TLS_VERIFY" });

  return (
    <>
      {offersStartTls(ldapUri) ? (
        <Checkbox
          description={
            <Trans>Use STARTTLS on a plain LDAP connection usually on port 389.</Trans>
          }
          id="starttls"
          label={<Trans>STARTTLS</Trans>}
          {...register("START_TLS")}
        />
      ) : null}
      {offersTlsVerify(ldapUri, startTls) ? (
        <>
          <Checkbox
            description={<Trans>Verify the TLS certificate of the server.</Trans>}
            id="tls"
            label={<Trans>Verify TLS</Trans>}
            {...register("TLS_VERIFY")}
          />
          {tlsVerify ? (
            <Box pl="xl">
              <TextInput
                id="tls_ca_file"
                label={
                  <Trans>
                    The file containing the CA certificate which signed the LDAP TLS
                    certificate.
                  </Trans>
                }
                placeholder="/etc/edumfa/ldap-ca.crt"
                {...register("TLS_CA_FILE")}
              />
            </Box>
          ) : null}
        </>
      ) : null}
    </>
  );
}
