import { Trans } from "@lingui/react/macro";
import type { ReactNode } from "react";

import { useAuth } from "../../auth/AuthProvider";
import { hasRight } from "../../auth/permissions";
import { hashHref } from "../../lib/hashbang";

export type UserSidebarItem = "add" | "details" | "list" | "password";

export interface UserSidebarProps {
  activeItem: UserSidebarItem;
  detailsUsername?: string | undefined;
  /** Realm selector rendered under "All users", like the legacy sidebar. */
  realmSelector?: ReactNode;
  userCount?: number | undefined;
}

/**
 * Port of the navigation in `user.html`. The documentation links point at
 * the latest docs because the running version number is only known to the
 * Angular login controller.
 */
const docsBaseUrl = "https://edumfa.readthedocs.io/en/latest/webui/";

export function UserSidebar({
  activeItem,
  detailsUsername,
  realmSelector,
  userCount
}: UserSidebarProps) {
  const { rights, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isUser = user?.role === "user";

  return (
    <>
      {isUser && hasRight(rights, "userlist") ? (
        <ul className="nav nav-pills nav-stacked">
          <li
            className={activeItem === "password" ? "active" : undefined}
            role="presentation"
          >
            <a href={hashHref("/user/password")}>
              <Trans>Your details</Trans>
            </a>
          </li>
        </ul>
      ) : null}

      {isAdmin ? (
        <ul className="nav nav-pills nav-stacked">
          <li
            className={activeItem === "list" ? "active" : undefined}
            role="presentation"
          >
            <a href={hashHref("/user/list")}>
              <Trans>All users</Trans>
            </a>
          </li>
          {realmSelector ? <li role="presentation">{realmSelector}</li> : null}
          {activeItem === "details" ? (
            <li className="active" role="presentation">
              <a>
                <Trans>User {detailsUsername}</Trans>
              </a>
            </li>
          ) : null}
          {hasRight(rights, "adduser") ? (
            <li
              className={activeItem === "add" ? "active" : undefined}
              role="presentation"
            >
              <a href={hashHref("/user/add")}>
                <Trans>Add user</Trans>
              </a>
            </li>
          ) : null}
          <li className="react-sidebar-section">
            <span>
              <Trans>Quick links</Trans>
            </span>
            <ul className="nav nav-pills nav-stacked">
              {hasRight(rights, "resolverwrite") ? (
                <li>
                  <a href={hashHref("/config/realms/list")}>
                    <Trans>Edit realms</Trans>
                  </a>
                </li>
              ) : null}
            </ul>
          </li>
          {userCount !== undefined ? (
            <li className="react-sidebar-meta">
              <span>
                <Trans>total users:</Trans>
              </span>
              &nbsp;{userCount}
            </li>
          ) : null}
          <li>
            <hr />
          </li>
          <li role="presentation">
            <HelpLink activeItem={activeItem} />
          </li>
        </ul>
      ) : null}
    </>
  );
}

function HelpLink({ activeItem }: { activeItem: UserSidebarItem }) {
  switch (activeItem) {
    case "add":
      return (
        <a href={`${docsBaseUrl}manage_users.html`} target="_external">
          <span className="glyphicon glyphicon-info-sign" aria-hidden="true" />
          <Trans>Help about manage Users</Trans>
        </a>
      );
    case "details":
      return (
        <a href={`${docsBaseUrl}user_details.html`} target="_external">
          <span className="glyphicon glyphicon-info-sign" aria-hidden="true" />
          <Trans>Help about User Details</Trans>
        </a>
      );
    default:
      return (
        <a href={`${docsBaseUrl}index.html#users`} target="_external">
          <span className="glyphicon glyphicon-info-sign" aria-hidden="true" />
          <Trans>Help about Users</Trans>
        </a>
      );
  }
}
