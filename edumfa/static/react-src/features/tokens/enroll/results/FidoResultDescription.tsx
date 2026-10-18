import { useLingui } from "@lingui/react/macro";

import type { FidoStage } from "./fidoStage";

export function FidoResultDescription({ stage }: { stage: FidoStage }) {
  const { t } = useLingui();

  switch (stage) {
    case "u2f":
      return t`You need to confirm the registration with your token either by pushing the blinking button or by replugging your token. This depends on the actual token model.`;
    case "webauthn":
      return t`You need to confirm the registration with your authenticator. For an external authenticator, this usually means pushing the button on the authenticator, or replugging it (if there is no button on the authenticator). If you want to use an authenticator that is integrated into your device, look for a dialog box from your operating system. If you do not see anything, please make sure that your authenticator supports WebAuthn.`;
    default:
      return t`The token is enrolled.`;
  }
}
