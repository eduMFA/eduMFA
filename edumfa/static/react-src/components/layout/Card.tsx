import { Box, Divider, Group, Paper, Title } from "@mantine/core";
import type { PropsWithChildren, ReactNode } from "react";

export interface CardProps {
  actions?: ReactNode;
  /** Removes the body padding, e.g. for a table that fills the card. */
  flush?: boolean;
  footer?: ReactNode;
  footerAlign?: "center" | "start";
  title?: ReactNode;
}

/** Bordered section panel with an optional header row and footer toolbar. */
export function Card({
  actions,
  children,
  flush = false,
  footer,
  footerAlign = "start",
  title
}: PropsWithChildren<CardProps>) {
  return (
    <Paper
      component="section"
      mb="lg"
      radius="md"
      style={{ overflow: "hidden" }}
      withBorder
    >
      {title || actions ? (
        <>
          <Group justify="space-between" px="md" py="sm" wrap="wrap">
            {title ? (
              <Title order={3} size="h5">
                {title}
              </Title>
            ) : (
              <span />
            )}
            {actions ? <Group gap="xs">{actions}</Group> : null}
          </Group>
          <Divider />
        </>
      ) : null}
      <Box p={flush ? 0 : "md"}>{children}</Box>
      {footer ? (
        <>
          <Divider />
          <Group
            bg="var(--mantine-color-gray-0)"
            gap="xs"
            justify={footerAlign === "center" ? "center" : "flex-start"}
            px="md"
            py="sm"
          >
            {footer}
          </Group>
        </>
      ) : null}
    </Paper>
  );
}
