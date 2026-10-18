import { ApplSpecFields } from "./fields/ApplSpecFields";
import { CertificateFields } from "./fields/CertificateFields";
import { EmailFields } from "./fields/EmailFields";
import { FourEyesFields } from "./fields/FourEyesFields";
import { IndexedSecretFields } from "./fields/IndexedSecretFields";
import { MotpFields } from "./fields/MotpFields";
import { OtpKeyFields } from "./fields/OtpKeyFields";
import { QuestionFields } from "./fields/QuestionFields";
import { RadiusFields } from "./fields/RadiusFields";
import { RemoteFields } from "./fields/RemoteFields";
import { SmsFields } from "./fields/SmsFields";
import { SshKeyFields } from "./fields/SshKeyFields";
import type { TokenTypeFieldsProps } from "./fields/types";
import { VascoFields } from "./fields/VascoFields";
import { YubicoFields } from "./fields/YubicoFields";
import { YubikeyFields } from "./fields/YubikeyFields";

export type { EnrollLookups, TokenTypeFieldsProps } from "./fields/types";

/**
 * The per-type "Token data" sections of `token.enroll.<type>.html`. Types
 * without inputs (spass, paper, tan, registration, push, tiqr, u2f,
 * webauthn) render nothing here; their help text lives in `TokenTypeHelp`.
 */
export function TokenTypeFields(props: TokenTypeFieldsProps) {
  switch (props.form.type) {
    case "4eyes":
      return <FourEyesFields {...props} />;
    case "applspec":
      return <ApplSpecFields {...props} />;
    case "certificate":
      return <CertificateFields {...props} />;
    case "daypassword":
    case "hotp":
    case "totp":
      return <OtpKeyFields {...props} />;
    case "email":
      return <EmailFields {...props} />;
    case "indexedsecret":
      return <IndexedSecretFields {...props} />;
    case "motp":
      return <MotpFields {...props} />;
    case "question":
      return <QuestionFields {...props} />;
    case "radius":
      return <RadiusFields {...props} />;
    case "remote":
      return <RemoteFields {...props} />;
    case "sms":
      return <SmsFields {...props} />;
    case "sshkey":
      return <SshKeyFields {...props} />;
    case "vasco":
      return <VascoFields {...props} />;
    case "yubico":
      return <YubicoFields {...props} />;
    case "yubikey":
      return <YubikeyFields {...props} />;
    default:
      return null;
  }
}
