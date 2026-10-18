import { useLingui } from "@lingui/react/macro";
import { NativeSelect } from "@mantine/core";

import { OtpKeyTimeFields } from "./OtpKeyTimeFields";
import { type TokenTypeFieldsProps } from "./types";
import { hasRight } from "@/auth/permissions";
import { hashAlgorithms, otpLengths } from "@/features/tokens/enroll/enrollForm";

/** OTP length, the type's time settings and the hash algorithm. */
export function OtpKeyParameterFields(props: TokenTypeFieldsProps) {
  const { t } = useLingui();

  const { form, onChange, rights } = props;
  const { type } = form;

  return (
    <>
      {!hasRight(rights, `${type}_otplen`) ? (
        <NativeSelect
          data={otpLengths.map(String)}
          description={
            form.genkey
              ? t`Some Authenticator Apps only support an OTP length of 6.`
              : undefined
          }
          id="otplen"
          label={type === "daypassword" ? t`password length` : t`OTP length`}
          mb="sm"
          onChange={(event) => {
            onChange({ otplen: Number(event.currentTarget.value) });
          }}
          value={String(form.otplen)}
        />
      ) : null}
      <OtpKeyTimeFields {...props} />
      {!hasRight(rights, `${type}_hashlib`) ? (
        <NativeSelect
          data={[...hashAlgorithms]}
          description={
            form.genkey
              ? t`Some Authenticator Apps only support the SHA1 algorithm.`
              : undefined
          }
          id="hashlib"
          label={t`Hash algorithm`}
          mb="sm"
          onChange={(event) => {
            onChange({ hashlib: event.currentTarget.value });
          }}
          value={form.hashlib}
        />
      ) : null}
    </>
  );
}
