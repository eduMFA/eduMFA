import { useLingui } from "@lingui/react/macro";
import { Button, Group } from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";

import { isResolverType, resolverEditorPath } from "./resolverTypes";
import type { ResolverConfig } from "@/api/config";
import { hashHref } from "@/lib/hashbang";

export interface ResolverActionsCellProps {
  canDelete: boolean;
  isDeleting: boolean;
  onDelete: () => void;
  resolver: ResolverConfig;
}

/** The edit link and the delete button of one row of the resolver list. */
export function ResolverActionsCell({
  canDelete,
  isDeleting,
  onDelete,
  resolver
}: ResolverActionsCellProps) {
  const { t } = useLingui();

  return (
    <Group gap="xs" justify="flex-end" wrap="nowrap">
      {isResolverType(resolver.type) ? (
        <Button
          component="a"
          href={hashHref(resolverEditorPath(resolver.type, resolver.resolvername))}
          leftSection={<IconEdit size={14} />}
          size="xs"
          variant="light"
        >
          {t`Edit`}
        </Button>
      ) : null}
      {canDelete ? (
        <Button
          color="red"
          leftSection={<IconTrash size={14} />}
          loading={isDeleting}
          onClick={onDelete}
          size="xs"
          variant="light"
        >
          {t`Delete`}
        </Button>
      ) : null}
    </Group>
  );
}
