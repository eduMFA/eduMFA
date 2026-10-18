import { useLingui } from "@lingui/react/macro";
import { Divider, NavLink } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

import type { TokenSidebarItem } from "@/features/tokens/TokenSidebar";

/**
 * The help links point at the latest docs because the running version
 * number is only known to the Angular login controller.
 */
const helpHrefs: Record<"details" | "import" | "list", string> = {
  details: "https://edumfa.readthedocs.io/en/latest/webui/token_details.html",
  import:
    "https://edumfa.readthedocs.io/en/latest/workflows_and_tools/import/index.html",
  list: "https://edumfa.readthedocs.io/en/latest/webui/index.html#tokens"
};

/** The documentation entry at the bottom of the list, import and details views. */
export function TokenSidebarHelpLink({ activeItem }: { activeItem: TokenSidebarItem }) {
  const { t } = useLingui();

  if (activeItem !== "details" && activeItem !== "import" && activeItem !== "list") {
    return null;
  }

  const helpLabel = (): string => {
    switch (activeItem) {
      case "list":
        return t`Help about Token`;
      case "import":
        return t`Help about Token Import`;
      default:
        return t`Help about Token Details`;
    }
  };

  return (
    <>
      <Divider my="xs" />
      <NavLink
        component="a"
        href={helpHrefs[activeItem]}
        label={helpLabel()}
        leftSection={<IconInfoCircle size={16} />}
        target="_external"
      />
    </>
  );
}
