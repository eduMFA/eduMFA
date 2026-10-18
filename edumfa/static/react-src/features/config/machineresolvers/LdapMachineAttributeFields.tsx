import { useLingui } from "@lingui/react/macro";
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
        label={t`No anonymous referral chasing`}
        {...register("NOREFERRALS")}
      />
      <TextInput
        id="machineIdAttribute"
        label={t`Machine ID Attribute`}
        placeholder={t`An Attribute or the DN to identify the machine`}
        required
        {...register("IDATTRIBUTE", { required: true })}
      />
      <TextInput
        id="ldapsearchfilter"
        label={t`Search Filter`}
        placeholder="(objectClass=computer)"
        required
        {...register("SEARCHFILTER", { required: true })}
      />
      <TextInput
        id="hostnameattribute"
        label={t`Hostname Attribute`}
        placeholder="dNSHostName"
        required
        {...register("HOSTNAMEATTRIBUTE", { required: true })}
      />
      <TextInput
        id="ipattribute"
        label={t`IP Address Attribute`}
        placeholder={t`An Attribute that contains the IP address.`}
        {...register("IPATTRIBUTE")}
      />
    </Stack>
  );
}
