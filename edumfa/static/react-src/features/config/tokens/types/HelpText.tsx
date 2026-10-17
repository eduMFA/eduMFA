import { Text } from "@mantine/core";
import type { PropsWithChildren } from "react";

/** The dimmed `help-block` paragraphs of the legacy partials. */
export function HelpText({ children }: PropsWithChildren) {
  return (
    <Text c="dimmed" mb="sm" size="sm">
      {children}
    </Text>
  );
}
