import { useLingui } from "@lingui/react/macro";

import { OtpKeyGenerateFields } from "./OtpKeyGenerateFields";
import { OtpKeyParameterFields } from "./OtpKeyParameterFields";
import { SectionTitle } from "./SectionTitle";
import { type TokenTypeFieldsProps } from "./types";

/** The HOTP, TOTP and DayPassword "Token data" section: key, length, timing, hash. */
export function OtpKeyFields(props: TokenTypeFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      {!props.isWizard ? <SectionTitle>{t`Token data`}</SectionTitle> : null}
      <OtpKeyGenerateFields {...props} />
      <OtpKeyParameterFields {...props} />
    </>
  );
}
