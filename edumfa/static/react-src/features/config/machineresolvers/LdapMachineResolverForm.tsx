import { Trans } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconWand } from "@tabler/icons-react";
import { useForm, type UseFormSetValue } from "react-hook-form";

import { LdapConnectionFields } from "./LdapConnectionFields";
import { LdapMachineAttributeFields } from "./LdapMachineAttributeFields";
import { LdapMachineResolverActions } from "./LdapMachineResolverActions";
import {
  activeDirectoryPreset,
  type LdapMachineResolverFormValues
} from "./ldapMachineResolverValues";
import { useLdapMachineResolverMutations } from "./useLdapMachineResolverMutations";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";

export interface LdapMachineResolverFormProps {
  initialValues: LdapMachineResolverFormValues;
  /** Stored keys of the resolver; sent back unchanged like the legacy `$scope.params`. */
  storedData: Record<string, unknown>;
}

/** Port of the legacy `presetAD`: fills in the machine attributes of an Active Directory. */
function applyActiveDirectoryPreset(
  setValue: UseFormSetValue<LdapMachineResolverFormValues>
) {
  const options = { shouldDirty: true, shouldValidate: true };

  setValue("SEARCHFILTER", activeDirectoryPreset.SEARCHFILTER, options);
  setValue("IDATTRIBUTE", activeDirectoryPreset.IDATTRIBUTE, options);
  setValue("IPATTRIBUTE", activeDirectoryPreset.IPATTRIBUTE, options);
  setValue("HOSTNAMEATTRIBUTE", activeDirectoryPreset.HOSTNAMEATTRIBUTE, options);
  setValue("NOREFERRALS", activeDirectoryPreset.NOREFERRALS, options);
}

/**
 * The form of `config.mresolvers.ldap.html`: connection, bind and machine
 * attribute fields, the Active Directory preset, the connection test and
 * the save action.
 */
export function LdapMachineResolverForm({
  initialValues,
  storedData
}: LdapMachineResolverFormProps) {
  const { rights } = useAuth();
  const { formState, handleSubmit, register, setValue, control } =
    useForm<LdapMachineResolverFormValues>({
      defaultValues: initialValues,
      mode: "onChange"
    });
  const { saveMutation, testMutation } = useLdapMachineResolverMutations(storedData);

  const submitResolver = handleSubmit((values) => {
    saveMutation.mutate(values);
  });
  const runTest = handleSubmit((values) => {
    testMutation.mutate(values);
  });

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
        <LdapConnectionFields
          control={control}
          nameError={formState.errors.resolvername?.message}
          register={register}
        />
      </Card>

      <Card
        actions={
          <Button
            leftSection={<IconWand size={16} />}
            onClick={() => {
              applyActiveDirectoryPreset(setValue);
            }}
            size="xs"
            variant="light"
          >
            <Trans>Preset Active Directory</Trans>
          </Button>
        }
        footer={
          <LdapMachineResolverActions
            canSave={hasRight(rights, "mresolverwrite")}
            isSaving={saveMutation.isPending}
            isTesting={testMutation.isPending}
            isValid={formState.isValid}
            onTest={() => {
              void runTest();
            }}
          />
        }
        footerAlign="center"
        title={<Trans>Machine attributes</Trans>}
      >
        <LdapMachineAttributeFields register={register} />
      </Card>
    </form>
  );
}
