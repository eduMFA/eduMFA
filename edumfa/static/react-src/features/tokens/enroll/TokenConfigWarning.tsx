import { msg } from "@lingui/core/macro";
import { Trans, useLingui } from "@lingui/react/macro";
import { Alert, Anchor } from "@mantine/core";
import type { MessageDescriptor } from "@lingui/core";
import type { ReactNode } from "react";

import { configString } from "./enrollForm";
import type { SystemConfig } from "@/api/config";
import { hashHref } from "@/lib/hashbang";

export interface TokenConfigWarningProps {
  systemConfig: SystemConfig;
  type: string;
}

interface ConfigWarning {
  color: "blue" | "red";
  /** Shown only while this system config key is empty; always when absent. */
  configKey?: string;
  label: MessageDescriptor;
  text: (link: ReactNode) => ReactNode;
}

/** The "please configure" hints of the legacy templates; only admins can act on them. */
const configWarnings: Record<string, ConfigWarning> = {
  email: {
    color: "red",
    configKey: "email.mailserver",
    label: msg`Email Token Config`,
    text: (link) => (
      <Trans>For Email tokens to work properly you need to set the {link}!</Trans>
    )
  },
  radius: {
    color: "blue",
    configKey: "radius.server",
    label: msg`RADIUS Token Config`,
    text: (link) => (
      <Trans>
        To ease the enrolling of RADIUS tokens you can set default values in the {link}.
      </Trans>
    )
  },
  sms: {
    color: "blue",
    label: msg`SMS Token Config`,
    text: (link) => (
      <Trans>For SMS tokens to work properly you need to set the {link}!</Trans>
    )
  },
  tiqr: {
    color: "red",
    configKey: "tiqr.regServer",
    label: msg`TiQR Token Config`,
    text: (link) => (
      <Trans>For TiQR tokens to work properly you need to set the {link}!</Trans>
    )
  },
  yubico: {
    color: "red",
    configKey: "yubico.id",
    label: msg`Yubico Token Config`,
    text: (link) => (
      <Trans>For Yubico tokens to work properly you need to set the {link}!</Trans>
    )
  }
};

/** The admin's "please configure" alert of the selected type, if it needs one. */
export function TokenConfigWarning({ systemConfig, type }: TokenConfigWarningProps) {
  const { i18n } = useLingui();
  const warning = configWarnings[type];
  const showWarning =
    warning !== undefined &&
    (warning.configKey === undefined || !configString(systemConfig, warning.configKey));

  if (!showWarning) {
    return null;
  }

  return (
    <Alert color={warning.color} variant="light">
      {warning.text(
        <Anchor href={hashHref(`/config/tokens/${type}`)} inherit>
          {i18n._(warning.label)}
        </Anchor>
      )}
    </Alert>
  );
}
