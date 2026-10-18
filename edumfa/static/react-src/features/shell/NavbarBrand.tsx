import { Anchor, Text } from "@mantine/core";

import { hashHref } from "@/lib/hashbang";
import { getUiConfig } from "@/lib/uiConfig";

export interface NavbarBrandProps {
  loggedIn: boolean;
}

/** The brand link: the instance logo (`EDUMFA_LOGO`) or the product name, leading to the start page. */
export function NavbarBrand({ loggedIn }: NavbarBrandProps) {
  const uiConfig = getUiConfig();
  const logoUrl = uiConfig.logo
    ? `${uiConfig.instanceUrl}/static/css/${uiConfig.logo}`
    : null;

  return (
    <Anchor
      className="app-brand"
      href={hashHref(loggedIn ? "/token/list" : "/login")}
      mr="sm"
      style={{ display: "inline-flex", lineHeight: 0 }}
    >
      {logoUrl ? (
        <img alt="eduMFA" height={40} src={logoUrl} />
      ) : (
        <Text fw={700}>eduMFA</Text>
      )}
    </Anchor>
  );
}
