import type { ReactNode } from "react";

export interface EmptyStateProps {
  message: ReactNode;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <tr>
      <td className="text-muted" colSpan={3}>
        {message}
      </td>
    </tr>
  );
}
