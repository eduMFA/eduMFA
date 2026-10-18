import { Anchor } from "@mantine/core";

import { isResolverType, resolverEditorPath } from "./resolverTypes";
import type { ResolverConfig } from "@/api/config";
import { hashHref } from "@/lib/hashbang";

export interface ResolverNameCellProps {
  resolver: ResolverConfig;
}

/** The resolver name, linked to its editor when the type has one. */
export function ResolverNameCell({ resolver }: ResolverNameCellProps) {
  return isResolverType(resolver.type) ? (
    <Anchor
      href={hashHref(resolverEditorPath(resolver.type, resolver.resolvername))}
      size="sm"
    >
      {resolver.resolvername}
    </Anchor>
  ) : (
    resolver.resolvername
  );
}
