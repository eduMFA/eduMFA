import { useLingui } from "@lingui/react/macro";
import { Accordion, Text } from "@mantine/core";

import { type PgpKeys } from "@/api/config";

export interface PgpKeyListProps {
  pgpKeys: PgpKeys | undefined;
}

/** The server's PGP keys, for token providers that deliver encrypted seed files. */
export function PgpKeyList({ pgpKeys }: PgpKeyListProps) {
  const { t } = useLingui();

  const entries = Object.entries(pgpKeys ?? {});

  if (entries.length === 0) {
    return null;
  }

  return (
    <Accordion multiple variant="separated">
      {entries.map(([keyId, key]) => (
        <Accordion.Item key={keyId} value={keyId}>
          <Accordion.Control>
            {t`PGP Key`} {keyId}
          </Accordion.Control>
          <Accordion.Panel>
            <Text mb="xs" size="sm">
              {t`Please pass the public key and the fingerprint to the token provider.`}
            </Text>
            <Text
              component="pre"
              ff="monospace"
              size="xs"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {key.armor}
            </Text>
            <Text size="sm">
              {t`Fingerprint`}: {key.fingerprint}
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
