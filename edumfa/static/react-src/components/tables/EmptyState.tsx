import type { ReactNode } from "react";

export interface EmptyStateProps {
  colSpan?: number;
  message: ReactNode;
}

export function EmptyState({ colSpan = 3, message }: EmptyStateProps) {
  return (
    <tr>
      <td className="text-muted" colSpan={colSpan}>
        {message}
      </td>
    </tr>
  );
}
