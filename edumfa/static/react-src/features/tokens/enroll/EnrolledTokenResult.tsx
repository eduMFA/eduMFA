import { ApplSpecResult } from "./results/ApplSpecResult";
import { CertificateResult } from "./results/CertificateResult";
import { FidoResult } from "./results/FidoResult";
import { MotpResult } from "./results/MotpResult";
import { OtpListResult } from "./results/OtpListResult";
import { OtpResult } from "./results/OtpResult";
import { PushResult } from "./results/PushResult";
import { RegistrationResult } from "./results/RegistrationResult";
import { TiqrResult } from "./results/TiqrResult";
import type { EnrolledTokenResultProps } from "./results/types";

export type { EnrolledTokenResultProps, FidoState } from "./results/types";

/**
 * Port of the `token.enrolled.<type>.html` templates: what the user needs
 * after the first `POST /token/init` answered (QR codes, OTP lists, codes,
 * downloads, FIDO progress).
 */
export function EnrolledTokenResult(props: EnrolledTokenResultProps) {
  switch (props.form.type) {
    case "applspec":
      return <ApplSpecResult {...props} />;
    case "certificate":
      return <CertificateResult {...props} />;
    case "daypassword":
    case "hotp":
    case "totp":
      return <OtpResult {...props} />;
    case "edupush":
    case "push":
      return <PushResult {...props} />;
    case "motp":
      return <MotpResult {...props} />;
    case "paper":
    case "tan":
      return <OtpListResult {...props} />;
    case "registration":
      return <RegistrationResult {...props} />;
    case "tiqr":
      return <TiqrResult {...props} />;
    case "u2f":
    case "webauthn":
      return <FidoResult {...props} />;
    default:
      return null;
  }
}
