import { test, expect } from "@playwright/test";

test.describe("세션 종료 기능 테스트", () => {
  test("로그인 → 새로고침 → 대시보드 유지 (로그아웃 안 됨)", async ({ page }) => {
    // 로그인
    await page.goto("/signin");
    await page.getByLabel("이메일").fill(process.env.TEST_USER_EMAIL!);
    await page.locator("#password").fill(process.env.TEST_USER_PASSWORD!);
    await page.locator("form").getByRole("button", { name: "로그인" }).click();
    await page.waitForURL("**/dashboard", { timeout: 15000 });

    // 새로고침
    await page.reload({ waitUntil: "networkidle" });

    // 여전히 대시보드에 있어야 함
    await expect(page).toHaveURL(/dashboard/);
    await expect(page).not.toHaveURL(/signin/);
  });

  test("로그인 없이 대시보드 접근 → 로그인 페이지로 리다이렉트", async ({ page }) => {
    // sessionStorage가 없는 상태에서 직접 접근
    await page.goto("/dashboard", { waitUntil: "networkidle", timeout: 15000 });

    // /signin으로 리다이렉트되어야 함 (서버 측 또는 클라이언트 측)
    await expect(page).toHaveURL(/signin/);
  });

  test("새 브라우저 컨텍스트에서 대시보드 접근 → 로그인 페이지로 리다이렉트", async ({ browser }) => {
    // 첫 번째 컨텍스트에서 로그인
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    await page1.goto("/signin");
    await page1.getByLabel("이메일").fill(process.env.TEST_USER_EMAIL!);
    await page1.locator("#password").fill(process.env.TEST_USER_PASSWORD!);
    await page1.locator("form").getByRole("button", { name: "로그인" }).click();
    await page1.waitForURL("**/dashboard", { timeout: 15000 });

    // 쿠키 가져오기 (세션 쿠키 확인)
    const cookies = await context1.cookies();
    const authCookies = cookies.filter((c) =>
      c.name.includes("auth-token") || c.name.includes("sb-")
    );

    console.log("Auth cookies:");
    authCookies.forEach((c) => {
      console.log(`  ${c.name}: expires=${c.expires === -1 ? "session" : c.expires}`);
    });

    // 쿠키 만료 시간 확인 (10분 = 600초 이내)
    const now = Date.now() / 1000;
    for (const cookie of authCookies) {
      expect(cookie.expires).toBeGreaterThan(now);
      expect(cookie.expires).toBeLessThanOrEqual(now + 600 + 10);
    }

    // 두 번째 컨텍스트 (새 브라우저 = 쿠키 없음, sessionStorage 없음)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    await page2.goto("/dashboard", { waitUntil: "networkidle", timeout: 15000 });
    // 인증 없이 접근 → /signin으로 리다이렉트
    await expect(page2).toHaveURL(/signin/);

    await context1.close();
    await context2.close();
  });
});
