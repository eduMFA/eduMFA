import { PasswordInput, TextInput } from "@mantine/core";
import type { ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

export interface TextFieldProps {
  autoComplete?: string;
  autoFocus?: boolean;
  hasError?: boolean;
  id: string;
  label?: ReactNode;
  placeholder?: string;
  registration: UseFormRegisterReturn;
  type?: string;
}

/** react-hook-form field on top of Mantine's text and password inputs. */
export function TextField({
  autoComplete,
  autoFocus,
  hasError,
  id,
  label,
  placeholder,
  registration,
  type = "text"
}: TextFieldProps) {
  const sharedProps = {
    autoComplete,
    autoFocus,
    error: hasError ? true : undefined,
    id,
    label,
    mb: "sm",
    placeholder,
    ...registration
  };

  if (type === "password") {
    return <PasswordInput {...sharedProps} />;
  }

  return <TextInput type={type} {...sharedProps} />;
}
