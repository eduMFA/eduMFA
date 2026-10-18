import {
  typeDependentFields,
  type EnrollFormState,
  type EnrollMode
} from "./enrollForm";
import { TokenDescriptionField } from "./TokenDescriptionField";
import { TokenTypeFields } from "./TokenTypeFields";
import { TokenTypeHelp } from "./TokenTypeHelp";
import { TokenTypeSelect } from "./TokenTypeSelect";
import type { EnrollFormModel } from "./useEnrollFormModel";
import { useAuth } from "@/auth/AuthProvider";

export interface TokenDataSectionProps {
  form: EnrollFormState;
  mode: EnrollMode;
  model: EnrollFormModel;
  onChange: (patch: Partial<EnrollFormState>) => void;
}

/** Token type, its help text, the type-specific inputs and the description. */
export function TokenDataSection({
  form,
  mode,
  model,
  onChange
}: TokenDataSectionProps) {
  const { rights, settings, user } = useAuth();
  const { defaults, errors, lookups, resolved, visibility } = model;
  const isWizard = mode === "wizard";

  return (
    <>
      {visibility.showTypeSelect ? (
        <TokenTypeSelect
          enrollTypes={defaults.enrollTypes}
          onChange={(type) => {
            // Port of `changeTokenType`: the type's defaults apply again.
            onChange({ ...typeDependentFields, type });
          }}
          value={resolved.type}
        />
      ) : null}

      <TokenTypeHelp
        appImages={settings.authenticatorAppImages}
        isAdmin={user?.role === "admin"}
        isWizard={isWizard}
        qrCodeWidth={visibility.qrCodeWidth}
        systemConfig={defaults.systemConfig}
        type={resolved.type}
      />

      <TokenTypeFields
        errors={errors}
        form={resolved}
        indexedSecretForced={settings.indexedSecretForceAttribute}
        isWizard={isWizard}
        lookups={lookups}
        onChange={onChange}
        rights={rights}
      />

      {visibility.showDescription ? (
        <TokenDescriptionField
          onChange={(description) => {
            onChange({ description });
          }}
          required={visibility.descriptionRequired}
          tooLong={errors.includes("descriptionLength")}
          value={form.description}
        />
      ) : null}
    </>
  );
}
