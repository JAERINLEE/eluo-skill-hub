/**
 * Dashboard Mobile Responsive E2E Tests
 *
 * NOTE: These tests require authentication. They use the `authenticated` project
 * configuration defined in playwright.config.ts, which depends on the `setup`
 * project (auth.setup.ts) saving storageState to playwright/.auth/user.json.
 * The test file is named *.auth.spec.ts to be picked up by the `authenticated`
 * project automatically.
 *
 * Rename this file to dashboard-mobile.auth.spec.ts if you want Playwright to
 * use the stored auth state automatically. As-is (.spec.ts), it runs under the
 * `chromium` project without auth and will redirect to /signin — add credentials
 * to .env.test and run with the `authenticated` project to exercise /dashboard.
 */

import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Mobile viewport tests (375 × 812 — iPhone SE / standard mobile)
// ---------------------------------------------------------------------------
test.describe('Mobile viewport (375x812) — dashboard responsive layout', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    // If unauthenticated, the middleware redirects to /signin.
    // When running under the `authenticated` project the stored storageState
    // keeps the session alive, so this guard is a no-op in that case.
    const url = page.url();
    if (url.includes('/signin')) {
      test.skip(true, '인증되지 않은 상태입니다. authenticated 프로젝트로 실행하세요.');
    }
    await page.waitForLoadState('networkidle');
  });

  // 1. Sidebar is hidden on initial mobile load
  test('사이드바는 모바일 초기 로드 시 숨겨진다', async ({ page }) => {
    // The aside has -translate-x-full when isOpen is false on mobile.
    // Playwright considers the element "not visible" when it is translated
    // fully off-screen.
    const sidebar = page.locator('aside');
    await expect(sidebar).not.toBeVisible();
  });

  // 2. Hamburger button is visible on mobile
  test('모바일에서 햄버거 메뉴 버튼이 표시된다', async ({ page }) => {
    const hamburger = page.getByRole('button', { name: '메뉴 열기' });
    await expect(hamburger).toBeVisible();
  });

  // 3. Sidebar opens on hamburger click, closes on backdrop click
  test('햄버거 클릭 시 사이드바가 열리고, 백드롭 클릭 시 닫힌다', async ({ page }) => {
    const hamburger = page.getByRole('button', { name: '메뉴 열기' });
    const sidebar = page.locator('aside');

    // Open sidebar
    await hamburger.click();
    // Wait for the 300ms CSS transition to complete
    await page.waitForTimeout(350);
    await expect(sidebar).toBeVisible();

    // Click the backdrop overlay (bg-black/50 fixed overlay rendered when sidebarOpen is true)
    const backdrop = page.locator('div.fixed.inset-0.bg-black\\/50');
    await expect(backdrop).toBeVisible();
    await backdrop.click();

    // Wait for closing transition
    await page.waitForTimeout(350);
    await expect(sidebar).not.toBeVisible();
  });

  // 4. Sidebar closes when a navigation item is clicked
  test('사이드바 내 메뉴 항목 클릭 시 사이드바가 닫힌다', async ({ page }) => {
    const hamburger = page.getByRole('button', { name: '메뉴 열기' });
    const sidebar = page.locator('aside');

    // Open sidebar
    await hamburger.click();
    await page.waitForTimeout(350);
    await expect(sidebar).toBeVisible();

    // Click the "전체" navigation button inside the sidebar
    const allButton = sidebar.getByRole('button', { name: '전체' });
    await allButton.click();

    // Wait for closing transition
    await page.waitForTimeout(350);
    await expect(sidebar).not.toBeVisible();
  });

  // 5. Search bar is visible and does not cause horizontal overflow
  test('검색창이 표시되고 가로 스크롤 없이 뷰포트 안에 렌더링된다', async ({ page }) => {
    const searchInput = page.locator('input[type="text"]');
    await expect(searchInput).toBeVisible();

    // The input bounding box must be within the 375px viewport width
    const box = await searchInput.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);

    // The page itself must not have horizontal scroll
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);
  });

  // 6. Skill cards display in a single column on mobile
  test('스킬 카드가 모바일에서 단일 열(1컬럼)로 표시된다', async ({ page }) => {
    // The grid container uses grid-cols-1 on mobile.
    // We check that each card's left offset is roughly the same (all in column 0)
    // and that no two cards share the same vertical position (they stack).
    const grid = page.locator('div.grid.grid-cols-1');
    const hasGrid = (await grid.count()) > 0;

    if (!hasGrid) {
      // No skills available in the test environment — skip gracefully.
      test.skip(true, '스킬 카드가 없어 컬럼 레이아웃 검증을 건너뜁니다.');
      return;
    }

    await expect(grid.first()).toBeVisible();

    const cards = grid.first().locator('> a');
    const cardCount = await cards.count();

    if (cardCount < 2) {
      // Not enough cards to verify stacking; just check the grid class exists.
      await expect(grid.first()).toBeVisible();
      return;
    }

    const firstBox = await cards.nth(0).boundingBox();
    const secondBox = await cards.nth(1).boundingBox();

    expect(firstBox).not.toBeNull();
    expect(secondBox).not.toBeNull();

    // In a single-column layout the cards stack vertically:
    // the second card's top (y) must be greater than the first card's bottom (y + height).
    expect(secondBox!.y).toBeGreaterThan(firstBox!.y + firstBox!.height - 1);

    // Both cards should have the same left offset (same column)
    expect(Math.abs(firstBox!.x - secondBox!.x)).toBeLessThan(2);
  });
});

// ---------------------------------------------------------------------------
// Desktop viewport tests (1280 × 800)
// ---------------------------------------------------------------------------
test.describe('Desktop viewport (1280x800) — dashboard responsive layout', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    const url = page.url();
    if (url.includes('/signin')) {
      test.skip(true, '인증되지 않은 상태입니다. authenticated 프로젝트로 실행하세요.');
    }
    await page.waitForLoadState('networkidle');
  });

  // 1. Sidebar is always visible on desktop without any toggle
  test('데스크톱에서 사이드바가 토글 없이 항상 표시된다', async ({ page }) => {
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // Verify the "ELUO HUB" logo text is visible inside the sidebar
    await expect(sidebar.getByText('ELUO HUB')).toBeVisible();
  });

  // 2. Hamburger button is hidden on desktop (md:hidden)
  test('데스크톱에서 햄버거 메뉴 버튼이 표시되지 않는다', async ({ page }) => {
    const hamburger = page.getByRole('button', { name: '메뉴 열기' });
    await expect(hamburger).toBeHidden();
  });

  // 3. Desktop layout: sidebar and main content are side by side
  test('데스크톱에서 사이드바와 메인 콘텐츠가 나란히 배치된다', async ({ page }) => {
    const sidebar = page.locator('aside');
    const main = page.locator('main');

    const sidebarBox = await sidebar.boundingBox();
    const mainBox = await main.boundingBox();

    expect(sidebarBox).not.toBeNull();
    expect(mainBox).not.toBeNull();

    // On desktop the sidebar sits to the left of main content.
    // The sidebar's right edge should be at or before the main's left edge.
    expect(sidebarBox!.x + sidebarBox!.width).toBeLessThanOrEqual(mainBox!.x + 1);

    // Both should be visible in the same horizontal viewport row (similar y offset)
    expect(Math.abs(sidebarBox!.y - mainBox!.y)).toBeLessThan(5);
  });
});
