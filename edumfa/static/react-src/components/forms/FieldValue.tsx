import { Box, Text } from "@mantine/core";
import type { ReactNode } from "react";

export interface FieldValueProps {
  children?: ReactNode;
  label: ReactNode;
  name?: string | undefined;
}

/** Read-only label/value pair used by the detail views. */
export function FieldValue({ children, label, name }: FieldValueProps) {
  const isEmpty = children === null || children === undefined || children === "";

  return (
    <Box mb="md">
      <Text c="dimmed" fw={600} size="xs" tt="uppercase">
        {label}
      </Text>
      <Text data-field={name} size="sm" {...(isEmpty ? { c: "gray.4" } : {})}>
        {isEmpty ? "—" : children}
      </Text>
    </Box>
  );
}
