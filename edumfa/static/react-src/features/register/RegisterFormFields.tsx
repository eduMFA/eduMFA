import { useLingui } from "@lingui/react/macro";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

import type { RegisterFormValues } from "./types";
import { TextField } from "@/components/forms/TextField";

export interface RegisterFormFieldsProps {
  errors: FieldErrors<RegisterFormValues>;
  register: UseFormRegister<RegisterFormValues>;
}

/** The inputs of the registration form: account, contact details and the password pair. */
export function RegisterFormFields({ errors, register }: RegisterFormFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <TextField
        autoFocus
        hasError={Boolean(errors.username)}
        id="username"
        label={t`Username`}
        placeholder={t`Username`}
        registration={register("username", { required: true })}
      />
      <TextField
        hasError={Boolean(errors.surname)}
        id="surname"
        label={t`Surname`}
        placeholder={t`Surname`}
        registration={register("surname", { required: true })}
      />
      <TextField
        hasError={Boolean(errors.givenname)}
        id="givenname"
        label={t`Given name`}
        placeholder={t`Given name`}
        registration={register("givenname", { required: true })}
      />
      <TextField
        hasError={Boolean(errors.email)}
        id="email"
        label={t`Email`}
        placeholder={t`Email`}
        registration={register("email", { required: true })}
        type="email"
      />
      <TextField
        id="mobile"
        label={t`Mobile`}
        placeholder={t`Mobile`}
        registration={register("mobile")}
      />
      <TextField
        id="phone"
        label={t`Phone`}
        placeholder={t`Phone`}
        registration={register("phone")}
      />
      <TextField
        autoComplete="new-password"
        hasError={Boolean(errors.password)}
        id="password"
        label={t`Password`}
        placeholder={t`Password`}
        registration={register("password", {
          deps: ["password2"],
          required: true
        })}
        type="password"
      />
      <TextField
        autoComplete="new-password"
        hasError={Boolean(errors.password2)}
        id="password2"
        placeholder={t`Password`}
        registration={register("password2", {
          required: true,
          validate: (value, values) => value === values.password
        })}
        type="password"
      />
    </>
  );
}
