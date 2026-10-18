import { SmsGatewayHeadersCard } from "./SmsGatewayHeadersCard";
import { SmsGatewayOptionsCard } from "./SmsGatewayOptionsCard";
import type { SmsGatewayEntryGroup, SmsGatewayFormValues } from "./smsGatewayValues";
import { SmsProviderParametersCard } from "./SmsProviderParametersCard";
import type { SmsProvider } from "@/api/servers";

export interface SmsProviderCardsProps {
  onDeleteEntry: (group: "headers" | "options", name: string) => void;
  onSetEntry: (group: SmsGatewayEntryGroup, name: string, value: string) => void;
  /** The selected provider module; nothing is shown until one is chosen. */
  provider: SmsProvider | undefined;
  values: SmsGatewayFormValues;
}

/** The cards that depend on the provider module: its parameters, and the options and headers it allows. */
export function SmsProviderCards({
  onDeleteEntry,
  onSetEntry,
  provider,
  values
}: SmsProviderCardsProps) {
  const declaredParameters = provider?.parameters ?? {};

  return (
    <>
      {provider ? (
        <SmsProviderParametersCard
          onChange={(name, value) => {
            onSetEntry("parameters", name, value);
          }}
          parameters={declaredParameters}
          values={values.parameters}
        />
      ) : null}

      {provider?.options_allowed ? (
        <SmsGatewayOptionsCard
          entries={values.options}
          onAdd={(name, value) => {
            onSetEntry("options", name, value);
          }}
          onDelete={(name) => {
            onDeleteEntry("options", name);
          }}
        />
      ) : null}

      {provider?.headers_allowed ? (
        <SmsGatewayHeadersCard
          entries={values.headers}
          onAdd={(name, value) => {
            onSetEntry("headers", name, value);
          }}
          onDelete={(name) => {
            onDeleteEntry("headers", name);
          }}
        />
      ) : null}
    </>
  );
}
