import { Trans } from "@lingui/react/macro";

import { OtpKeyGenerateFields } from "./OtpKeyGenerateFields";
import { OtpKeyParameterFields } from "./OtpKeyParameterFields";
import { SectionTitle } from "./SectionTitle";
import { type TokenTypeFieldsProps } from "./types";

/** The HOTP, TOTP and DayPassword "Token data" section: key, length, timing, hash. */
export function OtpKeyFields(props: TokenTypeFieldsProps) {
  return (
    <>
      {!props.isWizard ? (
        <SectionTitle>
          <Trans>Token data</Trans>
        </SectionTitle>
      ) : null}
      <OtpKeyGenerateFields {...props} />
      <OtpKeyParameterFields {...props} />
    </>
  );
}
