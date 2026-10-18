import { useLingui } from "@lingui/react/macro";
import { Anchor, Text } from "@mantine/core";

import { saveBlobAsFile } from "@/lib/download";
import { truncate } from "@/lib/strings";

/** Token info values the legacy view offered as downloads instead of text. */
const blobInfoKeys = ["certificate", "pkcs12"];

export interface TokenInfoEntryProps {
  infoKey: string;
  serial: string;
  value: string;
}

/**
 * One token info entry. Certificates and PKCS12 blobs are offered as
 * downloads like the legacy view; the file is built when the link is
 * clicked, so no object URL has to be kept alive. Other values are
 * truncated to 35 characters with the full value in the tooltip.
 */
export function TokenInfoEntry({ infoKey, serial, value }: TokenInfoEntryProps) {
  const { t } = useLingui();

  if (blobInfoKeys.includes(infoKey)) {
    const isPkcs12 = infoKey === "pkcs12";
    const download = () => {
      const blob = isPkcs12
        ? new Blob(
            [Uint8Array.from(atob(value), (character) => character.charCodeAt(0))],
            { type: "application/x-pkcs12" }
          )
        : new Blob([value], { type: "text/plain" });

      saveBlobAsFile(blob, isPkcs12 ? `${serial}.p12` : `${serial}.pem`);
    };

    return (
      <Anchor component="button" onClick={download} size="sm" type="button">
        {isPkcs12 ? t`PKCS12` : t`certificate`}
      </Anchor>
    );
  }

  return (
    <Text component="span" size="sm" title={value}>
      {infoKey}: {truncate(value, 35)}
    </Text>
  );
}
