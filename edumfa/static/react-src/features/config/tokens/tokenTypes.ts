import type { ComponentType } from "react";

import type { TokenConfigTypeKey } from "./tokenConfigForm";
import { DayPasswordConfigFields } from "@/features/config/tokens/types/DayPasswordConfigFields";
import { EmailConfigFields } from "@/features/config/tokens/types/EmailConfigFields";
import { HotpConfigFields } from "@/features/config/tokens/types/HotpConfigFields";
import { QuestionConfigFields } from "@/features/config/tokens/types/QuestionConfigFields";
import { RadiusConfigFields } from "@/features/config/tokens/types/RadiusConfigFields";
import { RemoteConfigFields } from "@/features/config/tokens/types/RemoteConfigFields";
import { SmsConfigFields } from "@/features/config/tokens/types/SmsConfigFields";
import { TiqrConfigFields } from "@/features/config/tokens/types/TiqrConfigFields";
import { TotpConfigFields } from "@/features/config/tokens/types/TotpConfigFields";
import { U2fConfigFields } from "@/features/config/tokens/types/U2fConfigFields";
import { WebAuthnConfigFields } from "@/features/config/tokens/types/WebAuthnConfigFields";
import { YubicoConfigFields } from "@/features/config/tokens/types/YubicoConfigFields";
import { YubikeyConfigFields } from "@/features/config/tokens/types/YubikeyConfigFields";
import type { TokenConfigFieldsProps } from "@/features/config/tokens/types/types";

/** Sidebar label and field component of every configurable token type. */
export const tokenTypes: Record<
  TokenConfigTypeKey,
  { label: string; Fields: ComponentType<TokenConfigFieldsProps> }
> = {
  hotp: { label: "HOTP", Fields: HotpConfigFields },
  totp: { label: "TOTP", Fields: TotpConfigFields },
  u2f: { label: "U2F", Fields: U2fConfigFields },
  webauthn: { label: "WebAuthn", Fields: WebAuthnConfigFields },
  radius: { label: "RADIUS", Fields: RadiusConfigFields },
  remote: { label: "Remote", Fields: RemoteConfigFields },
  sms: { label: "SMS", Fields: SmsConfigFields },
  tiqr: { label: "TiQR", Fields: TiqrConfigFields },
  email: { label: "EMail", Fields: EmailConfigFields },
  question: { label: "Questionnaire", Fields: QuestionConfigFields },
  yubico: { label: "Yubico", Fields: YubicoConfigFields },
  yubikey: { label: "Yubikey", Fields: YubikeyConfigFields },
  daypassword: { label: "DayPassword", Fields: DayPasswordConfigFields }
};
