import { Trans } from "@lingui/react/macro";
import { NativeSelect } from "@mantine/core";

import { OtpKeyTimeFields } from "./OtpKeyTimeFields";
import { type TokenTypeFieldsProps } from "./types";
import { hasRight } from "@/auth/permissions";
import { hashAlgorithms, otpLengths } from "@/features/tokens/enroll/enrollForm";

/** OTP length, the type's time settings and the hash algorithm. */
export function OtpKeyParameterFields(props: TokenTypeFieldsProps) {
  const { form, onChange, rights } = props;
  const { type } = form;

  return (
    <>
      {!hasRight(rights, `${type}_otplen`) ? (
        <NativeSelect
          data={otpLengths.map(String)}
          description={
            form.genkey ? (
              <Trans>Some Authenticator Apps only support an OTP length of 6.</Trans>
            ) : undefined
          }
          id="otplen"
          label={
            type === "daypassword" ? (
              <Trans>password length</Trans>
            ) : (
              <Trans>OTP length</Trans>
            )
          }
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
            form.genkey ? (
              <Trans>Some Authenticator Apps only support the SHA1 algorithm.</Trans>
            ) : undefined
          }
          id="hashlib"
          label={<Trans>Hash algorithm</Trans>}
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
