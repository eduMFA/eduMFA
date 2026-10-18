import { Trans, useLingui } from "@lingui/react/macro";
import {
  NativeSelect,
  PasswordInput,
  SimpleGrid,
  Stack,
  TextInput
} from "@mantine/core";
import type { Control, UseFormRegister } from "react-hook-form";

import {
  ldapAuthTypes,
  type LdapMachineResolverFormValues
} from "./ldapMachineResolverValues";
import { LdapTlsFields } from "./LdapTlsFields";
import { machineResolverNamePattern } from "./machineResolverFields";

export interface LdapConnectionFieldsProps {
  control: Control<LdapMachineResolverFormValues>;
  /** The validation message of the resolver name, if any. */
  nameError: string | undefined;
  register: UseFormRegister<LdapMachineResolverFormValues>;
}

/** The "LDAP connection" card: name, URI, TLS, base and bind settings and limits. */
export function LdapConnectionFields({
  control,
  nameError,
  register
}: LdapConnectionFieldsProps) {
  const { t } = useLingui();

  return (
    <Stack gap="sm">
      <TextInput
        autoFocus
        error={nameError}
        id="resolvername"
        label={<Trans>Resolver name</Trans>}
        placeholder="resolver1"
        required
        {...register("resolvername", {
          pattern: {
            message: t`The resource name must consist of letters, numbers and '_', '-', '.' and must not be the word 'test'`,
            value: machineResolverNamePattern
          },
          required: true
        })}
      />
      <TextInput
        id="serveruri"
        label={<Trans>Server URI</Trans>}
        placeholder="ldap://edumfa.server1, ldap://edumfa.server2"
        required
        {...register("LDAPURI", { required: true })}
      />
      <LdapTlsFields control={control} register={register} />
      <TextInput
        id="basedn"
        label={<Trans>Base DN</Trans>}
        placeholder="ou=users,dc=domain,dc=tld"
        required
        {...register("LDAPBASE", { required: true })}
      />
      <TextInput
        id="binddn"
        label={<Trans>Bind DN</Trans>}
        placeholder="cn=admin,ou=users,dc=domain,dc=tld"
        {...register("BINDDN")}
      />
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <PasswordInput
          autoComplete="new-password"
          id="bindpw"
          label={<Trans>Bind Password</Trans>}
          placeholder="topsecret"
          {...register("BINDPW")}
        />
        <NativeSelect
          data={ldapAuthTypes}
          id="authtype"
          label={<Trans>Bind Type</Trans>}
          {...register("AUTHTYPE")}
        />
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TextInput
          id="timeout"
          label={<Trans>Timeout (seconds)</Trans>}
          placeholder="5"
          required
          {...register("TIMEOUT", { required: true })}
        />
        <TextInput
          id="sizelimit"
          label={<Trans>Size Limit</Trans>}
          placeholder="500"
          required
          {...register("SIZELIMIT", { required: true })}
        />
      </SimpleGrid>
    </Stack>
  );
}
