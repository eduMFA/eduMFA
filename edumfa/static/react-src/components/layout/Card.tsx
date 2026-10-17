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
      className="content-card"
      component="section"
      mb="lg"
      radius="md"
      shadow="xs"
      style={{ overflow: "hidden" }}
      withBorder
    >
      {title || actions ? (
        <>
          <Group
            className="content-card-header"
            justify="space-between"
            px="md"
            py="sm"
            wrap="wrap"
          >
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
            className="content-card-footer"
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
