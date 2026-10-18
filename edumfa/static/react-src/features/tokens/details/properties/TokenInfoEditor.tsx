import { Trans, useLingui } from "@lingui/react/macro";
import { NativeSelect, Stack, TextInput } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";

import { hasInvalidValidityPeriod, toDate, type InfoDraft } from "./infoDraft";

export interface TokenInfoEditorProps {
  draft: InfoDraft;
  onChange: (draft: InfoDraft) => void;
  /** Only TOTP tokens offer the timeshift override. */
  showTimeShift: boolean;
}

/** The inputs of the info row in edit mode: auth counters, validity period, timeshift. */
export function TokenInfoEditor({
  draft,
  onChange,
  showTimeShift
}: TokenInfoEditorProps) {
  const { t } = useLingui();
  const invalidValidityPeriod = hasInvalidValidityPeriod(draft);

  return (
    <Stack gap="xs">
      <TextInput
        id="max_auth_count"
        inputMode="numeric"
        label={<Trans>Maximum Authentication Count</Trans>}
        onChange={(event) => {
          onChange({ ...draft, maxAuthCount: event.currentTarget.value });
        }}
        placeholder={t`Max allowed auths`}
        size="sm"
        type="number"
        value={draft.maxAuthCount}
      />
      <TextInput
        id="max_success_auth_count"
        inputMode="numeric"
        label={<Trans>Maximum Success Auth Count</Trans>}
        onChange={(event) => {
          onChange({ ...draft, maxSuccessAuthCount: event.currentTarget.value });
        }}
        placeholder={t`Max allowed successful auths`}
        size="sm"
        type="number"
        value={draft.maxSuccessAuthCount}
      />
      <DateTimePicker
        clearable
        id="validity_start"
        label={<Trans>Validity Start</Trans>}
        onChange={(value) => {
          onChange({ ...draft, validityStart: toDate(value) });
        }}
        size="sm"
        value={draft.validityStart}
        valueFormat="YYYY-MM-DD HH:mm"
      />
      <DateTimePicker
        clearable
        error={invalidValidityPeriod ? t`End Date before Start Date!` : undefined}
        id="validity_end"
        label={<Trans>Validity End</Trans>}
        onChange={(value) => {
          onChange({ ...draft, validityEnd: toDate(value) });
        }}
        size="sm"
        value={draft.validityEnd}
        valueFormat="YYYY-MM-DD HH:mm"
      />
      {showTimeShift ? (
        <NativeSelect
          data={["default", "True", "False"]}
          description={
            <Trans>Set to 'True' or 'False' to override setting in Token Config.</Trans>
          }
          id="use_timeshift"
          label={<Trans>Use Timeshift</Trans>}
          onChange={(event) => {
            onChange({ ...draft, useTimeShift: event.currentTarget.value });
          }}
          size="sm"
          value={draft.useTimeShift}
        />
      ) : null}
    </Stack>
  );
}
