import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react/macro";
import { Stack, Text } from "@mantine/core";
import type { MessageDescriptor } from "@lingui/core";

import { AppStoreImages } from "./AppStoreImages";
import { TokenConfigWarning } from "./TokenConfigWarning";
import type { SystemConfig } from "@/api/config";
import type { AuthenticatorAppImages } from "@/auth/AuthProvider";

export interface TokenTypeHelpProps {
  appImages: AuthenticatorAppImages;
  isAdmin: boolean;
  isWizard: boolean;
  qrCodeWidth: number;
  systemConfig: SystemConfig;
  type: string;
}

const pushDescription = [
  msg`With the PUSH token eduMFA sends a notification to your registered smartphone asking if you want to approve the authentication step. You can accept or deny the authentication on your smartphone.`,
  msg`For the enrollment process and for the authentication process your smartphone needs an internet connection to eduMFA.`
];

/** The introductory `help-block` paragraphs of `token.enroll.<type>.html`. */
const typeDescriptions: Record<string, MessageDescriptor[]> = {
  "4eyes": [
    msg`The 4 Eyes token will only authenticate if two or more users are present at once. You can define how many existing tokens of the given realms need to be present to perform a successful authentication.`
  ],
  applspec: [
    msg`The Application Specific Password Token is a static password, that can be bound to certain services. This static password then can only be used to authenticate at this service.`
  ],
  certificate: [
    msg`The Certificate Token lets you enroll an x509 ceritificate by the given CA.`
  ],
  daypassword: [
    msg`The DayPassword token is a time based password token. You can paste a secret key or have the server generate the secret and scan the QR code with an authenticator app that supports the token.`
  ],
  edupush: pushDescription,
  email: [msg`The Email Token sends the OTP value to the users email address.`],
  hotp: [
    msg`The HOTP token is an event based token. You can paste a secret key or have the server generate the secret and scan the QR code with an Authenticator App turning your smartphone into an authentication device. But note, that some Apps might have limitations in the supported hash algorithms or other parameters.`
  ],
  indexedsecret: [
    msg`The indexed secret Token is based on a shared secret between eduMFA and the user. During authentication the user is asked for random positions from this known secret.`
  ],
  motp: [
    msg`The mOTP token is a time based OTP token for mobile devices. You can have the server generate the secret and scan the QR code.`
  ],
  paper: [
    msg`The Paper token will let you print a list of OTP values. These OTP values can be used to authenticate. You need to use on value after the other.`
  ],
  push: pushDescription,
  question: [
    msg`The Questionnaire token will let you define answers to questions. When authenticating with this type of token, you will be asked a random question and then need to provide the previously defined answer.`
  ],
  radius: [
    msg`The RADIUS token forwards the authentication request to another RADIUS server. You can choose if the PIN should be stripped and checked locally.`
  ],
  registration: [
    msg`The registration token is a code, that the user can use to authenticate once! After using this code to login, the registration token is deleted and can not be used anymore.`,
    msg`This is used, so that the user can enroll a token on his own, after logging in for the first time.`
  ],
  remote: [
    msg`The remote token forwards the authentication request to another eduMFA server. You can choose if the PIN should be stripped and checked locally.`
  ],
  sms: [msg`The SMS Token sends an OTP value to the mobile phone of the user.`],
  spass: [
    msg`The Simple Pass Token does not take additional arguments. You only need to specify an OTP PIN.`
  ],
  sshkey: [
    msg`The SSH Key Token stores the public SSH Key in the server. This can be used to authenticate to a secure shell.`
  ],
  tan: [
    msg`The TAN token will let you print a list of OTP values. These OTP values can be used to authenticate. The values can be used in an arbitrary order.`
  ],
  tiqr: [
    msg`The TiQR token is a Smartphone App token, which allows easy authentication by just scanning a QR Code during the authentication process.`
  ],
  totp: [
    msg`The TOTP token is a time based token. You can paste a secret key or have the server generate the secret and scan the QR code with an Authenticator App turning your smartphone into an authentication device. But note, that some Apps might have limitations in the supported hash algorithms or other parameters.`
  ],
  u2f: [
    msg`The U2F token is a token defined by the Fido Alliance. You can register this token with any webservice and with as many web services you wish to.`
  ],
  vasco: [
    msg`The VASCO token is a proprietary OTP token. You can paste the VASCO token blob in a hexlified format.`
  ],
  webauthn: [
    msg`The WebAuthn token is a token defined by the W3C and the Fido Alliance. You can register this token with any webservice and with as many web services you wish to.`
  ],
  yubico: [
    msg`The Yubico Cloud mode forwards the authentication request to the YubiCloud. The Yubikey needs to be registered with the YubiCloud.`
  ],
  yubikey: [
    msg`The Yubikey Token is an USB device that emits an event based One Time Password. You can initialize the Yubikey using the YubiKey personalization tools. The secret hex key and the final OTP length are needed here. For tokens compatible with the Yubico cloud service the OTP length must be 44 (12 characters UID and 32 characters OTP). When programming the token for the Yubico cloud service, the Public Identity Length must be 6 bytes, which will give you a UID with 12 characters. The current OTP length of a programmed YubiKey can automatically be determined by inserting it in the test field.`
  ]
};

/** The wizard keeps its own prolog; these templates hide their intro there. */
const descriptionHiddenInWizard = new Set(["daypassword", "hotp", "totp"]);

/** Token types whose enrollment shows the authenticator app store QR codes. */
const appTokenTypes = new Set(["daypassword", "edupush", "hotp", "push", "totp"]);

/**
 * Help shown above the type-specific inputs: the intro paragraphs, the app
 * store QR codes (`token.display.apps.html`) and the admin config hints.
 */
export function TokenTypeHelp({
  appImages,
  isAdmin,
  isWizard,
  qrCodeWidth,
  systemConfig,
  type
}: TokenTypeHelpProps) {
  const { i18n } = useLingui();
  const descriptions =
    isWizard && descriptionHiddenInWizard.has(type)
      ? []
      : (typeDescriptions[type] ?? []);

  return (
    <Stack gap="xs" mb="md">
      {descriptions.map((description) => (
        <Text c="dimmed" key={description.id} size="sm">
          {i18n._(description)}
        </Text>
      ))}
      {appTokenTypes.has(type) ? (
        <AppStoreImages images={appImages} isWizard={isWizard} width={qrCodeWidth} />
      ) : null}
      {isAdmin ? <TokenConfigWarning systemConfig={systemConfig} type={type} /> : null}
    </Stack>
  );
}
