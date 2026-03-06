import { test, expect } from "@playwright/test";

test("대시보드에서 로그아웃 → 로그인 페이지로 이동", async ({ page }) => {
  // 로그인
  await page.goto("/signin");
  await page.getByLabel("이메일").fill(process.env.TEST_USER_EMAIL!);
  await page.locator("#password").fill(process.env.TEST_USER_PASSWORD!);
  await page.locator("form").getByRole("button", { name: "로그인" }).click();
  await page.waitForURL("**/dashboard", { timeout: 15000 });

  // 프로필 드롭다운 열기 → 로그아웃 클릭
  await page.getByRole("button", { name: "User profile" }).click();
  await page.getByRole("menuitem", { name: "로그아웃" }).click();

  // /signin으로 이동해야 함
  await page.waitForURL("**/signin", { timeout: 15000 });
  await expect(page).toHaveURL(/signin/);
});
