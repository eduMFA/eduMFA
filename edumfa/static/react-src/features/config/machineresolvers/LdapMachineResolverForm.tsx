import { Trans, useLingui } from "@lingui/react/macro";
import {
  Box,
  Button,
  Checkbox,
  NativeSelect,
  PasswordInput,
  SimpleGrid,
  Stack,
  TextInput
} from "@mantine/core";
import { IconDeviceFloppy, IconPlugConnected, IconWand } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import {
  activeDirectoryPreset,
  ldapAuthTypes,
  offersStartTls,
  offersTlsVerify,
  toLdapMachineResolverRequest,
  type LdapMachineResolverFormValues
} from "./ldapMachineResolverValues";
import { machineResolverNamePattern } from "./machineResolverFields";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  machineResolverQueryKeys,
  saveMachineResolver,
  testMachineResolver
} from "@/api/machineResolvers";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";
import { notify } from "@/lib/notify";

export interface LdapMachineResolverFormProps {
  initialValues: LdapMachineResolverFormValues;
  /** Stored keys of the resolver; sent back unchanged like the legacy `$scope.params`. */
  storedData: Record<string, unknown>;
}

/**
 * The form of `config.mresolvers.ldap.html`: connection, bind and machine
 * attribute fields, the Active Directory preset, the connection test and
 * the save action. The STARTTLS and TLS fields follow the URI like the
 * legacy `ng-show` conditions; hidden values stay in the payload.
 */
export function LdapMachineResolverForm({
  initialValues,
  storedData
}: LdapMachineResolverFormProps) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLingui();
  const { rights } = useAuth();
  const { formState, handleSubmit, register, setValue, control } =
    useForm<LdapMachineResolverFormValues>({
      defaultValues: initialValues,
      mode: "onChange"
    });
  const ldapUri = useWatch({ control, name: "LDAPURI" });
  const startTls = useWatch({ control, name: "START_TLS" });
  const tlsVerify = useWatch({ control, name: "TLS_VERIFY" });

  const saveMutation = useMutation({
    mutationFn: (values: LdapMachineResolverFormValues) =>
      saveMachineResolver(
        apiClient,
        values.resolvername,
        toLdapMachineResolverRequest(values, storedData)
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: machineResolverQueryKeys.all });
      void navigate("/config/machineresolvers/list");
    }
  });
  const testMutation = useMutation({
    mutationFn: (values: LdapMachineResolverFormValues) =>
      testMachineResolver(apiClient, toLdapMachineResolverRequest(values, storedData)),
    onSuccess: (result) => {
      notify(result.description, result.success ? "success" : "danger");
    }
  });

  const submitResolver = handleSubmit((values) => {
    saveMutation.mutate(values);
  });
  const runTest = handleSubmit((values) => {
    testMutation.mutate(values);
  });

  const applyActiveDirectoryPreset = () => {
    const options = { shouldDirty: true, shouldValidate: true };

    setValue("SEARCHFILTER", activeDirectoryPreset.SEARCHFILTER, options);
    setValue("IDATTRIBUTE", activeDirectoryPreset.IDATTRIBUTE, options);
    setValue("IPATTRIBUTE", activeDirectoryPreset.IPATTRIBUTE, options);
    setValue("HOSTNAMEATTRIBUTE", activeDirectoryPreset.HOSTNAMEATTRIBUTE, options);
    setValue("NOREFERRALS", activeDirectoryPreset.NOREFERRALS, options);
  };

  return (
    <form
      noValidate
      onSubmit={(event) => {
        void submitResolver(event);
      }}
    >
      <ErrorAlert error={saveMutation.error} />
      <ErrorAlert error={testMutation.error} />

      <Card title={<Trans>LDAP connection</Trans>}>
        <Stack gap="sm">
          <TextInput
            autoFocus
            error={formState.errors.resolvername?.message}
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
          {offersStartTls(ldapUri) ? (
            <Checkbox
              description={
                <Trans>
                  Use STARTTLS on a plain LDAP connection usually on port 389.
                </Trans>
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
      </Card>

      <Card
        actions={
          <Button
            leftSection={<IconWand size={16} />}
            onClick={applyActiveDirectoryPreset}
            size="xs"
            variant="light"
          >
            <Trans>Preset Active Directory</Trans>
          </Button>
        }
        footer={
          <>
            <Button
              color="green"
              disabled={!formState.isValid}
              leftSection={<IconPlugConnected size={16} />}
              loading={testMutation.isPending}
              onClick={() => {
                void runTest();
              }}
              type="button"
              variant="light"
            >
              <Trans>Test LDAP Resolver</Trans>
            </Button>
            {hasRight(rights, "mresolverwrite") ? (
              <Button
                disabled={!formState.isValid}
                leftSection={<IconDeviceFloppy size={16} />}
                loading={saveMutation.isPending}
                type="submit"
              >
                <Trans>Save resolver</Trans>
              </Button>
            ) : null}
          </>
        }
        footerAlign="center"
        title={<Trans>Machine attributes</Trans>}
      >
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
      </Card>
    </form>
  );
}
