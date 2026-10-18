import { Trans, useLingui } from "@lingui/react/macro";
import { Button, NativeSelect } from "@mantine/core";

import type { AttachTokenForm } from "./useAttachToken";
import { ApplicationOptionInput } from "@/components/forms/ApplicationOptionInput";
import { SerialLookupField } from "@/components/forms/SerialLookupField";
import { Card } from "@/components/layout/Card";

export interface AttachTokenCardProps {
  applicationNames: string[];
  attach: AttachTokenForm;
}

/** Serial lookup, application select and the application's option inputs. */
export function AttachTokenCard({ applicationNames, attach }: AttachTokenCardProps) {
  const { t } = useLingui();

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        attach.mutation.mutate();
      }}
    >
      <Card
        footer={
          <Button
            disabled={!attach.canAttach}
            loading={attach.mutation.isPending}
            type="submit"
          >
            <Trans>Attach Token</Trans>
          </Button>
        }
        title={<Trans>Attach a new token</Trans>}
      >
        <SerialLookupField
          id="attachSerial"
          includeUser
          onChange={attach.setSerial}
          placeholder={t`start typing a serial number of a token.`}
          value={attach.serial}
        />

        <NativeSelect
          data={[{ label: "", value: "" }, ...applicationNames]}
          id="application"
          label={<Trans>Application</Trans>}
          mb="sm"
          onChange={(event) => {
            attach.selectApplication(event.currentTarget.value);
          }}
          required
          value={attach.application}
        />

        {Object.entries(attach.applicationOptions).map(([name, spec]) => (
          <ApplicationOptionInput
            idPrefix="option"
            key={name}
            name={name}
            onChange={(value) => {
              attach.setOption(name, value);
            }}
            spec={spec}
            value={attach.options[name]}
          />
        ))}
      </Card>
    </form>
  );
}
