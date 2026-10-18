import { useLingui } from "@lingui/react/macro";

import { type EnrollFormState, type EnrollMode } from "./enrollForm";
import { EnrollSubmitButton } from "./EnrollSubmitButton";
import { TokenAssignmentSection } from "./TokenAssignmentSection";
import { TokenDataSection } from "./TokenDataSection";
import type { EnrollFormModel } from "./useEnrollFormModel";
import { Card } from "@/components/layout/Card";

export interface EnrollFormCardProps {
  canSubmit: boolean;
  form: EnrollFormState;
  /** The first `/token/init` is in flight. */
  isSubmitting: boolean;
  mode: EnrollMode;
  model: EnrollFormModel;
  onChange: (patch: Partial<EnrollFormState>) => void;
  onSubmit: () => void;
}

/** The "Token" card: type, data, owner and PIN, with the enroll button below. */
export function EnrollFormCard({
  canSubmit,
  form,
  isSubmitting,
  mode,
  model,
  onChange,
  onSubmit
}: EnrollFormCardProps) {
  const { t } = useLingui();

  const isRollover = mode === "rollover";

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();

        if (canSubmit) {
          onSubmit();
        }
      }}
    >
      <Card
        footer={
          <EnrollSubmitButton
            disabled={!canSubmit}
            isRollover={isRollover}
            loading={isSubmitting}
          />
        }
        footerAlign="center"
        title={isRollover ? t`Token data` : t`Token`}
      >
        <TokenDataSection form={form} mode={mode} model={model} onChange={onChange} />
        <TokenAssignmentSection
          errors={model.errors}
          form={form}
          onChange={onChange}
          realm={model.resolved.realm}
          realmNames={model.defaults.realmNames}
          visibility={model.visibility}
        />
      </Card>
    </form>
  );
}
