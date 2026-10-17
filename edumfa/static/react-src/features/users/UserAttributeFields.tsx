import { useLingui } from "@lingui/react/macro";
import { PasswordInput, SimpleGrid, TextInput } from "@mantine/core";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { getUserFieldLabel } from "./userFieldLabels";
import { FieldValue } from "@/components/forms/FieldValue";
import type { UserFieldDefinition } from "@/lib/userAttributes";

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

  return (
    <SimpleGrid
      cols={{ base: 1, sm: 2 }}
      spacing="md"
      verticalSpacing={isEditing ? "sm" : 0}
    >
      {visibleFields.map((field) => {
        const label = getUserFieldLabel(i18n, field.name);

        if (!isEditing) {
          return (
            <FieldValue key={field.name} label={label} name={field.name}>
              {formatFieldValue(values[field.name])}
            </FieldValue>
          );
        }

        const hasError = Boolean(errors?.[field.name]);
        const registration = register(field.name, { required: field.required });

        if (field.type === "password") {
          return (
            <PasswordInput
              autoComplete="new-password"
              error={hasError ? true : undefined}
              id={field.name}
              key={field.name}
              label={label}
              required={field.required}
              {...registration}
            />
          );
        }

        return (
          <TextInput
            autoComplete="off"
            error={hasError ? true : undefined}
            id={field.name}
            key={field.name}
            label={label}
            required={field.required}
            type={field.type}
            {...registration}
          />
        );
      })}
    </SimpleGrid>
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
