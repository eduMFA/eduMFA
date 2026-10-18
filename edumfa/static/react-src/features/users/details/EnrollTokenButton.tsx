import { Trans } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";

export interface EnrollTokenButtonProps {
  canEnroll: boolean;
  href: string;
}

/** Links to the enrollment wizard; without an enroll right it is inert. */
export function EnrollTokenButton({ canEnroll, href }: EnrollTokenButtonProps) {
  return (
    <Button
      aria-disabled={!canEnroll}
      component="a"
      data-disabled={!canEnroll}
      href={canEnroll ? href : undefined}
      id="enrollButton"
      leftSection={<IconPlus size={16} />}
      onClick={
        canEnroll
          ? undefined
          : (event) => {
              event.preventDefault();
            }
      }
      size="sm"
    >
      <Trans>Enroll New Token</Trans>
    </Button>
  );
}
