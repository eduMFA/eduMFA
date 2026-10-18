import { Trans, useLingui } from "@lingui/react/macro";
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
        label={<Trans>Username</Trans>}
        placeholder={t`Username`}
        registration={register("username", { required: true })}
      />
      <TextField
        hasError={Boolean(errors.surname)}
        id="surname"
        label={<Trans>Surname</Trans>}
        placeholder={t`Surname`}
        registration={register("surname", { required: true })}
      />
      <TextField
        hasError={Boolean(errors.givenname)}
        id="givenname"
        label={<Trans>Given name</Trans>}
        placeholder={t`Given name`}
        registration={register("givenname", { required: true })}
      />
      <TextField
        hasError={Boolean(errors.email)}
        id="email"
        label={<Trans>Email</Trans>}
        placeholder={t`Email`}
        registration={register("email", { required: true })}
        type="email"
      />
      <TextField
        id="mobile"
        label={<Trans>Mobile</Trans>}
        placeholder={t`Mobile`}
        registration={register("mobile")}
      />
      <TextField
        id="phone"
        label={<Trans>Phone</Trans>}
        placeholder={t`Phone`}
        registration={register("phone")}
      />
      <TextField
        autoComplete="new-password"
        hasError={Boolean(errors.password)}
        id="password"
        label={<Trans>Password</Trans>}
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
