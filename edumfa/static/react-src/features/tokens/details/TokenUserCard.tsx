import type { TokenDetail } from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { AssignedUserCard } from "@/features/tokens/details/user/AssignedUserCard";
import { AssignUserForm } from "@/features/tokens/details/user/AssignUserForm";
import { UnassignTokenCard } from "@/features/tokens/details/user/UnassignTokenCard";
import { useUnassignToken } from "@/features/tokens/details/user/useUnassignToken";

export interface TokenUserCardProps {
  onRefresh: () => Promise<void>;
  serial: string;
  token: TokenDetail;
}

/**
 * Port of the user section in `token.details.html`: the assigned user with
 * the unassign action, or the assign form for an unassigned token. A user
 * who unassigns their own token is sent back to the list like the legacy
 * controller did.
 */
export function TokenUserCard({ onRefresh, serial, token }: TokenUserCardProps) {
  const { rights, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isUser = user?.role === "user";
  const isAssigned = Boolean(token.user_id);
  const unassignMutation = useUnassignToken({ onRefresh, serial });
  const showAssignForm = hasRight(rights, "assign") && !isAssigned && !token.locked;

  return (
    <>
      {isAdmin && isAssigned ? (
        <AssignedUserCard
          error={unassignMutation.error}
          isUnassigning={unassignMutation.isPending}
          onUnassign={() => {
            unassignMutation.mutate();
          }}
          token={token}
        />
      ) : null}

      {isUser && !token.locked && hasRight(rights, "unassign") ? (
        <UnassignTokenCard
          error={unassignMutation.error}
          isPending={unassignMutation.isPending}
          onUnassign={() => {
            unassignMutation.mutate();
          }}
        />
      ) : null}

      {showAssignForm ? <AssignUserForm onRefresh={onRefresh} serial={serial} /> : null}
    </>
  );
}
