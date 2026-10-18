import { useLingui } from "@lingui/react/macro";

import type { FidoStage } from "./fidoStage";

export function FidoResultTitle({ stage }: { stage: FidoStage }) {
  const { t } = useLingui();

  switch (stage) {
    case "u2f":
      return t`Take action on your token`;
    case "webauthn":
      return t`Take action on your authenticator`;
    default:
      return t`Token enrolled`;
  }
}
