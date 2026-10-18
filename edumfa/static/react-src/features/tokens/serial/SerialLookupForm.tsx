import { Trans, useLingui } from "@lingui/react/macro";
import { Button, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

import { SerialLookupFilters } from "./SerialLookupFilters";
import {
  type LookupStep,
  type SerialLookupFieldName,
  type SerialLookupFields
} from "./types";
import { Card } from "@/components/layout/Card";

export interface SerialLookupFormProps {
  countPending: boolean;
  fields: SerialLookupFields;
  inputsDisabled: boolean;
  onFieldChange: (name: SerialLookupFieldName, value: string) => void;
  onSubmit: () => void;
  step: LookupStep;
}

/** The search parameters; submitting asks for the candidate count first. */
export function SerialLookupForm({
  countPending,
  fields,
  inputsDisabled,
  onFieldChange,
  onSubmit,
  step
}: SerialLookupFormProps) {
  const { t } = useLingui();

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Card
        footer={
          step === "init" ? (
            <Button
              disabled={fields.otp.trim().length === 0}
              leftSection={<IconSearch size={16} />}
              loading={countPending}
              type="submit"
            >
              <Trans>Get Serial Number</Trans>
            </Button>
          ) : undefined
        }
        title={<Trans>Search parameters</Trans>}
      >
        <TextInput
          autoComplete="off"
          disabled={inputsDisabled}
          id="otp"
          label={<Trans>OTP Value</Trans>}
          mb="sm"
          onChange={(event) => {
            onFieldChange("otp", event.currentTarget.value);
          }}
          placeholder={t`enter some OTP value`}
          required
          value={fields.otp}
        />
        <SerialLookupFilters
          fields={fields}
          inputsDisabled={inputsDisabled}
          onFieldChange={onFieldChange}
        />
      </Card>
    </form>
  );
}
