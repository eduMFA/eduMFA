import { Trans } from "@lingui/react/macro";
import { hashHref } from "../../lib/hashbang";

export interface MachineSidebarProps {
  activeItem: "details" | "list";
  machineCount?: number | undefined;
  machineId?: string | undefined;
}

/**
 * Port of the navigation in `machine.html`. The legacy template printed a
 * literal `$scope.machinecount`; the count is rendered properly here.
 */
export function MachineSidebar({
  activeItem,
  machineCount,
  machineId
}: MachineSidebarProps) {
  return (
    <ul className="nav nav-pills nav-stacked">
      <li className={activeItem === "list" ? "active" : undefined} role="presentation">
        <a href={hashHref("/machine/list")}>
          <Trans>All Machines</Trans>
        </a>
      </li>
      {activeItem === "details" ? (
        <li className="active" role="presentation">
          <a>
            <Trans>Machine {machineId}</Trans>
          </a>
        </li>
      ) : null}
      <li className="react-sidebar-section">
        <span>
          <Trans>Quick links</Trans>
        </span>
      </li>
      <li>
        <a href={hashHref("/config/machineresolvers/list")}>
          <Trans>Edit Machine Resolvers</Trans>
        </a>
      </li>
      {machineCount !== undefined ? (
        <li className="react-sidebar-meta">
          <Trans>Number of machines: {machineCount}</Trans>
        </li>
      ) : null}
    </ul>
  );
}
