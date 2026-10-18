import { IconArrowDown, IconArrowUp, IconArrowsSort } from "@tabler/icons-react";

import type { SortDirection } from "./DataTable";

export interface SortIconProps {
  direction: SortDirection | null;
}

/** The sort marker of a sortable header: the active direction or the neutral arrows. */
export function SortIcon({ direction }: SortIconProps) {
  if (direction === "asc") {
    return <IconArrowUp aria-hidden size={12} />;
  }

  if (direction === "desc") {
    return <IconArrowDown aria-hidden size={12} />;
  }

  return <IconArrowsSort aria-hidden size={12} style={{ opacity: 0.4 }} />;
}
