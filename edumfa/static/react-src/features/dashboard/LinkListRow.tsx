import { Anchor, Group, Table } from "@mantine/core";

export interface LinkListRowProps {
  links: { href: string; key: string; label: string }[];
}

/** A full-width row listing links, e.g. the policy names under their count. */
export function LinkListRow({ links }: LinkListRowProps) {
  if (links.length === 0) {
    return null;
  }

  return (
    <Table.Tr>
      <Table.Td colSpan={2}>
        <Group gap={6}>
          {links.map((link) => (
            <Anchor href={link.href} key={link.key} size="sm">
              {link.label}
            </Anchor>
          ))}
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}
