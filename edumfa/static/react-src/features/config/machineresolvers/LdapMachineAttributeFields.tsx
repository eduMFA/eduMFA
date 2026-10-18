import { Trans, useLingui } from "@lingui/react/macro";
import { Checkbox, Stack, TextInput } from "@mantine/core";
import type { UseFormRegister } from "react-hook-form";

import type { LdapMachineResolverFormValues } from "./ldapMachineResolverValues";

export interface LdapMachineAttributeFieldsProps {
  register: UseFormRegister<LdapMachineResolverFormValues>;
}

/** The "Machine attributes" card: referral chasing and the attributes that describe a machine. */
export function LdapMachineAttributeFields({
  register
}: LdapMachineAttributeFieldsProps) {
  const { t } = useLingui();

  return (
    <Stack gap="sm">
      <Checkbox
        id="noreferrals"
        label={<Trans>No anonymous referral chasing</Trans>}
        {...register("NOREFERRALS")}
      />
      <TextInput
        id="machineIdAttribute"
        label={<Trans>Machine ID Attribute</Trans>}
        placeholder={t`An Attribute or the DN to identify the machine`}
        required
        {...register("IDATTRIBUTE", { required: true })}
      />
      <TextInput
        id="ldapsearchfilter"
        label={<Trans>Search Filter</Trans>}
        placeholder="(objectClass=computer)"
        required
        {...register("SEARCHFILTER", { required: true })}
      />
      <TextInput
        id="hostnameattribute"
        label={<Trans>Hostname Attribute</Trans>}
        placeholder="dNSHostName"
        required
        {...register("HOSTNAMEATTRIBUTE", { required: true })}
      />
      <TextInput
        id="ipattribute"
        label={<Trans>IP Address Attribute</Trans>}
        placeholder={t`An Attribute that contains the IP address.`}
        {...register("IPATTRIBUTE")}
      />
    </Stack>
  );
}
