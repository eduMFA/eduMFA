import { useLingui } from "@lingui/react/macro";
import { NativeSelect, TextInput } from "@mantine/core";

import { type TokenTypeFieldsProps } from "./types";
import { hasRight } from "@/auth/permissions";
import { timeShiftOptions, timeSteps } from "@/features/tokens/enroll/enrollForm";

/** The TOTP time step and time shift, or the DayPassword validity period. */
export function OtpKeyTimeFields({ form, onChange, rights }: TokenTypeFieldsProps) {
  const { t } = useLingui();

  const { type } = form;
  const timeStepOptions = timeSteps.includes(
    form.timeStep as (typeof timeSteps)[number]
  )
    ? [...timeSteps]
    : [form.timeStep, ...timeSteps];

  return (
    <>
      {type === "totp" && !hasRight(rights, "totp_timestep") ? (
        <NativeSelect
          data={timeStepOptions}
          description={t`seconds`}
          id="timestep"
          label={t`Timestep`}
          mb="sm"
          onChange={(event) => {
            onChange({ timeStep: event.currentTarget.value });
          }}
          value={form.timeStep}
        />
      ) : null}
      {type === "daypassword" && !hasRight(rights, "daypassword_timestep") ? (
        <TextInput
          description={
            form.genkey
              ? t`The time in which the password can be used. For example '1d' or '12h'.`
              : undefined
          }
          id="timestep"
          label={t`Timestep`}
          mb="sm"
          onChange={(event) => {
            onChange({ timeStep: event.currentTarget.value });
          }}
          placeholder="12h or 1d"
          required
          value={form.timeStep}
        />
      ) : null}
      {type === "totp" && !hasRight(rights, "totp_timeshift") ? (
        <NativeSelect
          data={[...timeShiftOptions]}
          description={t`Set to 'True' or 'False' to override setting in Token Config.`}
          id="use_timeshift"
          label={t`Use Timeshift`}
          mb="sm"
          onChange={(event) => {
            onChange({ useTimeShift: event.currentTarget.value });
          }}
          value={form.useTimeShift}
        />
      ) : null}
    </>
  );
}
