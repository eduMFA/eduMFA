export function hasRight(rights: readonly string[], action: string): boolean {
  return rights.includes(action);
}

export function getRightsValue(
  rights: readonly string[],
  action: string,
  defaultValue: string | boolean = false
): string | boolean {
  const match = rights.find((entry) => entry.startsWith(`${action}=`));

  return match?.split("=").slice(1).join("=") ?? defaultValue;
}

export function hasMainMenu(menus: readonly string[], menu: string): boolean {
  return menus.includes(menu);
}

export function hasEnrollRight(rights: readonly string[]): boolean {
  return rights.some((entry) => entry.startsWith("enroll"));
}
