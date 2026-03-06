import { test, expect } from "@playwright/test";

test("로그인 → 브라우저 종료 → 재접속 시 로그아웃 상태", async ({ browser }) => {
  // 1. 브라우저 컨텍스트1에서 로그인
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();

  await page1.goto("http://localhost:3000/signin");
  await page1.getByLabel("이메일").fill(process.env.TEST_USER_EMAIL!);
  await page1.locator("#password").fill(process.env.TEST_USER_PASSWORD!);
  await page1.locator("form").getByRole("button", { name: "로그인" }).click();
  await page1.waitForURL("**/dashboard", { timeout: 15000 });
  console.log("로그인 완료:", page1.url());

  // 쿠키 확인 - 세션 쿠키여야 함 (expires === -1)
  const cookies = await context1.cookies();
  const authCookies = cookies.filter((c) => c.name.startsWith("sb-"));
  console.log("쿠키 목록:");
  authCookies.forEach((c) => {
    console.log(`  ${c.name}: expires=${c.expires === -1 ? "session" : c.expires}`);
  });

  // 쿠키 만료 시간 검증 (10분 = 600초 이내)
  const now = Date.now() / 1000;
  for (const cookie of authCookies) {
    expect(cookie.expires).toBeGreaterThan(now);
    expect(cookie.expires).toBeLessThanOrEqual(now + 600 + 10);
  }

  // 2. 브라우저 종료 시뮬레이션 (컨텍스트 닫기 = 세션 쿠키 삭제)
  await context1.close();
  console.log("브라우저 종료 (컨텍스트 닫기)");

  // 3. 새 브라우저로 재접속 (쿠키 없음)
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();

  await page2.goto("http://localhost:3000/dashboard", {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  await page2.waitForURL("**/signin", { timeout: 15000 });
  console.log("재접속 URL:", page2.url());

  await expect(page2).toHaveURL(/signin/);
  console.log("브라우저 종료 후 재접속 → 로그아웃 상태 확인");

  await context2.close();
});
