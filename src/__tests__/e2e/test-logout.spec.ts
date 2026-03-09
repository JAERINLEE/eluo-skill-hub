import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3001";
const EMAIL = process.env.TEST_USER_EMAIL!;
const PASSWORD = process.env.TEST_USER_PASSWORD!;

async function login(page: import("@playwright/test").Page) {
  await page.goto(`${BASE}/signin`, { waitUntil: "networkidle" });
  await page.locator("#email").fill(EMAIL);
  await page.locator("#password").fill(PASSWORD);
  await page.locator("form").getByRole("button", { name: "로그인" }).click();
  await page.waitForURL("**/dashboard", { timeout: 20000 });
}

test.describe.serial("로그아웃/세션 테스트", () => {
  test("1. 로그아웃 후 /signin에 정상 머무름 (리다이렉트 루프 없음)", async ({ page }) => {
    await login(page);
    console.log("✅ 로그인 완료:", page.url());

    // 로그아웃
    await page.getByRole("button", { name: "User profile" }).click();
    await page.getByRole("menuitem", { name: "로그아웃" }).click();
    await page.waitForURL("**/signin", { timeout: 15000 });
    console.log("✅ 로그아웃 후 URL:", page.url());

    // 새로고침 후에도 /signin에 머물러야 함
    await page.reload({ waitUntil: "networkidle", timeout: 15000 });
    console.log("✅ 새로고침 후 URL:", page.url());
    await expect(page).toHaveURL(/signin/);
  });

  test("2. 로그아웃 후 /dashboard 직접 접근 → /signin 리다이렉트", async ({ page }) => {
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 15000 });
    console.log("✅ 비인증 dashboard 접근 후 URL:", page.url());
    await expect(page).toHaveURL(/signin/);
  });

  test("3. 로그인 후 새 탭에서 dashboard 접근 → 로그인 유지", async ({ browser }) => {
    const context = await browser.newContext();
    const page1 = await context.newPage();

    await login(page1);

    const page2 = await context.newPage();
    await page2.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 15000 });
    console.log("✅ 새 탭 dashboard URL:", page2.url());
    await expect(page2).toHaveURL(/dashboard/);

    await context.close();
  });

  test("4. 크로스탭 로그아웃: 탭A 로그아웃 → 탭B도 로그아웃", async ({ browser }) => {
    const context = await browser.newContext();
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    // 두 탭 모두 로그인 상태
    await login(pageA);
    await pageB.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 15000 });
    await expect(pageB).toHaveURL(/dashboard/);
    console.log("✅ 두 탭 모두 dashboard");

    // 탭A에서 로그아웃
    await pageA.getByRole("button", { name: "User profile" }).click();
    await pageA.getByRole("menuitem", { name: "로그아웃" }).click();
    await pageA.waitForURL("**/signin", { timeout: 15000 });
    console.log("✅ 탭A 로그아웃 완료");

    // 탭B도 /signin으로 이동해야 함
    await pageB.waitForURL("**/signin", { timeout: 15000 });
    console.log("✅ 탭B도 로그아웃 완료:", pageB.url());
    await expect(pageB).toHaveURL(/signin/);

    await context.close();
  });

  test("5. 세션 쿠키 확인 (maxAge/expires 없음 = 브라우저 종료 시 삭제)", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await login(page);

    const cookies = await context.cookies();
    const authCookies = cookies.filter((c) => c.name.startsWith("sb-"));
    console.log("쿠키 목록:");
    authCookies.forEach((c) => {
      console.log(`  ${c.name}: expires=${c.expires === -1 ? "session" : c.expires}`);
    });

    // 세션 쿠키 검증 (expires === -1 = 브라우저 종료 시 삭제)
    for (const cookie of authCookies) {
      expect(cookie.expires).toBe(-1);
    }

    await context.close();
  });
});
