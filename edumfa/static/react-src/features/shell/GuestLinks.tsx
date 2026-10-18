import { useLingui } from "@lingui/react/macro";
import { NavLink } from "@mantine/core";
import { useLocation } from "react-router-dom";

import { hashHref } from "@/lib/hashbang";

export interface GuestLinksProps {
  /** Self-registration is enabled (`GET /register`), so the register link is offered. */
  canRegister: boolean;
}

/** The menu entries of a visitor without a session: register and login. */
export function GuestLinks({ canRegister }: GuestLinksProps) {
  const { t } = useLingui();

  const { pathname } = useLocation();

  return (
    <>
      {canRegister ? (
        <NavLink
          active={pathname.startsWith("/register")}
          component="a"
          href={hashHref("/register")}
          label={t`Register`}
          style={{ borderRadius: "var(--mantine-radius-md)", width: "auto" }}
        />
      ) : null}
      <NavLink
        active={pathname === "/" || pathname.startsWith("/login")}
        component="a"
        href={hashHref("/login")}
        label={t`Login`}
        style={{ borderRadius: "var(--mantine-radius-md)", width: "auto" }}
      />
    </>
  );
}
