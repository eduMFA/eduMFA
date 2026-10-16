import { useLingui } from "@lingui/react/macro";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { getUserFieldLabel } from "./userFieldLabels";
import { splitIntoColumns, type UserFieldDefinition } from "../../lib/userAttributes";

export type UserFormValues = Record<string, string>;

export interface UserAttributeFieldsProps {
  errors?: FieldErrors<UserFormValues> | undefined;
  fields: readonly UserFieldDefinition[];
  isEditing: boolean;
  register: UseFormRegister<UserFormValues>;
  values: Record<string, unknown>;
}

/**
 * Port of `user.add.dynamic.form.fields.html`: renders the resolver's user
 * attributes in two columns, either as read-only fields or as inputs. The
 * password attribute only appears while editing.
 */
export function UserAttributeFields({
  errors,
  fields,
  isEditing,
  register,
  values
}: UserAttributeFieldsProps) {
  const { i18n } = useLingui();
  const visibleFields = isEditing
    ? fields
    : fields.filter((field) => field.type !== "password");
  const [leftColumn, rightColumn] = splitIntoColumns(visibleFields);

  const renderField = (field: UserFieldDefinition) => {
    const label = getUserFieldLabel(i18n, field.name);

    if (!isEditing) {
      return (
        <div className="react-field" key={field.name}>
          <span className="react-field__label">{label}</span>
          <div className="react-field__value" data-field={field.name}>
            {formatFieldValue(values[field.name])}
          </div>
        </div>
      );
    }

    const hasError = Boolean(errors?.[field.name]);

    return (
      <div
        className={hasError ? "form-group has-error" : "form-group"}
        key={field.name}
      >
        <label className="control-label" htmlFor={field.name}>
          {label}
        </label>
        <input
          autoComplete={field.type === "password" ? "new-password" : "off"}
          className="form-control"
          id={field.name}
          type={field.type}
          {...register(field.name, { required: field.required })}
        />
      </div>
    );
  };

  return (
    <div className="row">
      <div className="col-sm-6">{leftColumn.map(renderField)}</div>
      <div className="col-sm-6">{rightColumn.map(renderField)}</div>
    </div>
  );
}

/** Renders a user-store value the way the legacy `{{ User[field.name] }}` binding did. */
export function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => formatFieldValue(entry)).join(", ");
  }

  return JSON.stringify(value);
}
