import { expect, test } from "@playwright/test";

test("client type hash route is addressable during coexistence", async ({ page }) => {
  await page.goto("/#/component/clienttype");

  await expect(page).toHaveURL(/#\/component\/clienttype/);
});
