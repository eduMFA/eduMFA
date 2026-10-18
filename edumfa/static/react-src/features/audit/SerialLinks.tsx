import { Anchor, Group } from "@mantine/core";

import { hashHref } from "@/lib/hashbang";

/** The serial column; a challenge may list several serials comma-separated. */
export function SerialLinks({ serial }: { serial: string | null }) {
  if (!serial) {
    return null;
  }

  return (
    <Group gap={4}>
      {serial.split(",").map((singleSerial, index) => (
        <Anchor
          href={hashHref(`/token/details/${encodeURIComponent(singleSerial)}`)}
          key={`${singleSerial}-${String(index)}`}
          size="sm"
        >
          {singleSerial}
        </Anchor>
      ))}
    </Group>
  );
}
