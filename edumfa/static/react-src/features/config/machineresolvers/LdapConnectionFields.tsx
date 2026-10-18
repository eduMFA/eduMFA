import { useLingui } from "@lingui/react/macro";
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
        label={t`Resolver name`}
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
        label={t`Server URI`}
        placeholder="ldap://edumfa.server1, ldap://edumfa.server2"
        required
        {...register("LDAPURI", { required: true })}
      />
      <LdapTlsFields control={control} register={register} />
      <TextInput
        id="basedn"
        label={t`Base DN`}
        placeholder="ou=users,dc=domain,dc=tld"
        required
        {...register("LDAPBASE", { required: true })}
      />
      <TextInput
        id="binddn"
        label={t`Bind DN`}
        placeholder="cn=admin,ou=users,dc=domain,dc=tld"
        {...register("BINDDN")}
      />
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <PasswordInput
          autoComplete="new-password"
          id="bindpw"
          label={t`Bind Password`}
          placeholder="topsecret"
          {...register("BINDPW")}
        />
        <NativeSelect
          data={ldapAuthTypes}
          id="authtype"
          label={t`Bind Type`}
          {...register("AUTHTYPE")}
        />
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TextInput
          id="timeout"
          label={t`Timeout (seconds)`}
          placeholder="5"
          required
          {...register("TIMEOUT", { required: true })}
        />
        <TextInput
          id="sizelimit"
          label={t`Size Limit`}
          placeholder="500"
          required
          {...register("SIZELIMIT", { required: true })}
        />
      </SimpleGrid>
    </Stack>
  );
}
