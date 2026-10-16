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
  return (
    <div className={hasError ? "form-group has-error" : "form-group"}>
      {label ? <label htmlFor={id}>{label}</label> : null}
      <input
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className="form-control"
        id={id}
        placeholder={placeholder}
        type={type}
        {...registration}
      />
    </div>
  );
}
