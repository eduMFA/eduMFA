import { Trans } from "@lingui/react/macro";
import { Button, NativeSelect } from "@mantine/core";
import { IconLink } from "@tabler/icons-react";

import { useAttachMachine } from "./useAttachMachine";
import type { ApplicationDefinitions } from "@/api/machines";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { ApplicationOptionInput } from "@/components/forms/ApplicationOptionInput";
import { MachineLookupField } from "@/components/forms/MachineLookupField";
import { Card } from "@/components/layout/Card";

export interface AttachMachineFormProps {
  applications: ApplicationDefinitions;
  /** Re-reads the assignments after the token was attached. */
  onAttached: () => Promise<void>;
  serial: string;
}

/** The form that attaches the token to another machine. */
export function AttachMachineForm({
  applications,
  onAttached,
  serial
}: AttachMachineFormProps) {
  const {
    application,
    attach,
    canAttach,
    isOffline,
    machine,
    optionSpecs,
    options,
    selectApplication,
    setMachine,
    setOption
  } = useAttachMachine({ applications, onAttached, serial });
  const applicationNames = Object.keys(applications);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();

        if (canAttach) {
          attach.mutate();
        }
      }}
    >
      <Card
        footer={
          <Button
            disabled={!canAttach}
            id="attachMachineButton"
            leftSection={<IconLink size={16} />}
            loading={attach.isPending}
            type="submit"
          >
            <Trans>Attach Machine</Trans>
          </Button>
        }
        title={<Trans>Attach to a new Machine</Trans>}
      >
        <ErrorAlert error={attach.error} />
        <NativeSelect
          data={[{ label: "", value: "" }, ...applicationNames]}
          id="attachApplication"
          label={<Trans>Application</Trans>}
          mb="sm"
          onChange={(event) => {
            selectApplication(event.currentTarget.value);
          }}
          required
          value={application}
        />
        {isOffline ? null : (
          <MachineLookupField
            id="attachMachine"
            onChange={setMachine}
            required
            value={machine}
          />
        )}
        {Object.entries(optionSpecs).map(([name, spec]) => (
          <ApplicationOptionInput
            idPrefix="option"
            key={name}
            name={name}
            onChange={(value) => {
              setOption(name, value);
            }}
            spec={spec}
            value={options[name]}
          />
        ))}
      </Card>
    </form>
  );
}
