import { Trans } from "@lingui/react/macro";
import { Accordion, SimpleGrid } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import dayjs from "dayjs";

import type { EnrollFormState } from "./enrollForm";

export interface ExtendedAttributesFieldsProps {
  onChange: (patch: Pick<EnrollFormState, "validityEnd" | "validityStart">) => void;
  validityEnd: Date | null;
  validityError: string | undefined;
  validityStart: Date | null;
}

/**
 * The collapsed "Extended Attributes" section of the legacy form: the
 * validity period an admin may set while enrolling.
 */
export function ExtendedAttributesFields({
  onChange,
  validityEnd,
  validityError,
  validityStart
}: ExtendedAttributesFieldsProps) {
  return (
    <Accordion mt="md" variant="separated">
      <Accordion.Item value="extended">
        <Accordion.Control>
          <Trans>Extended Attributes</Trans>
        </Accordion.Control>
        <Accordion.Panel>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <DateTimePicker
              clearable
              id="validity_start"
              label={<Trans>Validity Start</Trans>}
              minDate={new Date()}
              onChange={(value) => {
                onChange({ validityEnd, validityStart: toDate(value) });
              }}
              value={validityStart}
              valueFormat="YYYY-MM-DD HH:mm"
            />
            <DateTimePicker
              clearable
              error={validityError}
              id="validity_end"
              label={<Trans>Validity End</Trans>}
              minDate={new Date()}
              onChange={(value) => {
                onChange({ validityEnd: toDate(value), validityStart });
              }}
              value={validityEnd}
              valueFormat="YYYY-MM-DD HH:mm"
            />
          </SimpleGrid>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}

function toDate(value: Date | string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = dayjs(value);

  return parsed.isValid() ? parsed.toDate() : null;
}
