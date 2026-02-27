import { render, screen } from "@testing-library/react";
import Home from "@/app/page";
import { DashboardShell } from "@/shared/ui/components/dashboard-shell";

// -- page.tsx 통합 테스트를 위한 모킹 --

// createSupabaseServerClient 모킹
const mockGetUser = jest.fn();
jest.mock("@/shared/infrastructure/supabase/server", () => ({
  createSupabaseServerClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
}));

// useDashboardState 훅 모킹 (DashboardShell 내부 상태)
jest.mock("@/shared/ui/hooks/use-dashboard-state", () => ({
  useDashboardState: jest.fn().mockReturnValue({
    selectedCategory: "전체",
    searchQuery: "",
    isMobileMenuOpen: false,
    isMobile: false,
    pageTitle: "대시보드",
    filteredSkills: [],
    setSelectedCategory: jest.fn(),
    setSearchQuery: jest.fn(),
    toggleMobileMenu: jest.fn(),
    closeMobileMenu: jest.fn(),
  }),
}));

// UserProfilePopover를 간소화하여 렌더링 (Radix Portal 문제 회피)
// 실제 컴포넌트의 핵심 동작(userEmail 표시)만 검증한다
jest.mock("@/shared/ui/components/user-profile-popover", () => ({
  UserProfilePopover: ({ userEmail }: { userEmail: string }) => (
    <div data-testid="user-profile-popover" data-user-email={userEmail}>
      {userEmail}
    </div>
  ),
}));

// next/themes 모킹 (ThemeToggle 의존성)
jest.mock("next-themes", () => ({
  useTheme: jest.fn().mockReturnValue({
    theme: "light",
    setTheme: jest.fn(),
  }),
}));

// AppSidebar, MainContent, SearchInput을 간소화하여 테스트 대상에 집중한다
jest.mock("@/shared/ui/components/app-sidebar", () => ({
  AppSidebar: () => <nav data-testid="app-sidebar">사이드바</nav>,
}));

jest.mock("@/shared/ui/components/main-content", () => ({
  MainContent: () => <main data-testid="main-content">메인</main>,
}));

describe("서버-클라이언트 인증 정보 전달 흐름 통합 테스트", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("page.tsx -> DashboardShell -> AppHeader 이메일 전달 흐름", () => {
    it("서버 컴포넌트에서 조회한 사용자 이메일이 DashboardShell을 거쳐 AppHeader의 프로필 영역까지 전달된다", async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: "test-uuid",
            email: "dev@eluocnc.com",
            app_metadata: { provider: "email" },
            user_metadata: { name: "Developer" },
            aud: "authenticated",
            created_at: "2024-01-01",
          },
        },
        error: null,
      });

      const Page = await Home();
      render(Page);

      // AppHeader 내부의 UserProfilePopover가 최종적으로 이메일을 수신하여 표시한다
      const popover = screen.getByTestId("user-profile-popover");
      expect(popover).toHaveTextContent("dev@eluocnc.com");
      expect(popover).toHaveAttribute("data-user-email", "dev@eluocnc.com");
    });

    it("DashboardShell이 서버에서 받은 이메일을 AppHeader의 프로필 영역에 정확히 전달한다", () => {
      render(<DashboardShell userEmail="admin@eluocnc.com" />);

      // AppHeader 내부의 UserProfilePopover까지 이메일이 전달되어야 한다
      const popover = screen.getByTestId("user-profile-popover");
      expect(popover).toHaveTextContent("admin@eluocnc.com");
      expect(popover).toHaveAttribute("data-user-email", "admin@eluocnc.com");
    });

    it("인증 상태일 때 프로필 영역이 활성 상태로 렌더링된다", () => {
      render(<DashboardShell userEmail="user@eluocnc.com" />);

      // AppHeader 내부에서 userEmail이 존재하면 프로필 영역에 활성 스타일(ring)이 적용된다
      const profileArea = screen.getByTestId("user-profile");
      expect(profileArea).toBeInTheDocument();
      expect(profileArea.className).toMatch(/ring/);
    });
  });

  describe("민감 데이터 클라이언트 미노출 검증", () => {
    it("서버에서 조회한 사용자 객체 중 이메일만 클라이언트에 전달되고, 토큰/비밀번호는 노출되지 않는다", async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: "sensitive-uuid-12345",
            email: "user@eluocnc.com",
            app_metadata: { provider: "email", secret_key: "app-secret-key" },
            user_metadata: { name: "User", phone: "010-1234-5678" },
            aud: "authenticated",
            created_at: "2024-01-01",
            access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret",
            refresh_token: "refresh-token-secret-value",
          },
        },
        error: null,
      });

      const Page = await Home();
      const { container } = render(Page);

      // 렌더링된 전체 HTML에서 민감 데이터가 포함되지 않는지 검증한다
      const fullHtml = container.innerHTML;
      expect(fullHtml).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret");
      expect(fullHtml).not.toContain("refresh-token-secret-value");
      expect(fullHtml).not.toContain("app-secret-key");
      expect(fullHtml).not.toContain("sensitive-uuid-12345");

      // 이메일만 정상적으로 표시되는지 확인한다
      expect(fullHtml).toContain("user@eluocnc.com");
    });

    it("DashboardShell -> AppHeader 체인에서 props로 전달된 데이터에 민감 정보가 포함되지 않는다", () => {
      const { container } = render(<DashboardShell userEmail="safe@eluocnc.com" />);
      const fullHtml = container.innerHTML;

      // 이메일만 포함되고, DashboardShell에는 이메일 외 민감 props가 없음을 검증
      expect(fullHtml).toContain("safe@eluocnc.com");
      // DashboardShellProps 인터페이스에 userEmail만 존재하므로 구조적으로 민감 데이터 전달이 불가능하다
      // 이는 TypeScript 타입 시스템에 의해 컴파일 타임에 보장되지만, 런타임에서도 검증한다
      expect(fullHtml).not.toContain("token");
      expect(fullHtml).not.toContain("password");
    });

    it("getUser 실패 시 이메일 빈 문자열이 전달되고 프로필 스켈레톤이 표시된다", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Auth session expired" },
      });

      const Page = await Home();
      const { container } = render(Page);

      // 에러 메시지가 HTML에 노출되지 않는다
      expect(container.innerHTML).not.toContain("Auth session expired");

      // 이메일이 없으므로 프로필 스켈레톤이 표시된다
      const skeleton = screen.getByTestId("profile-skeleton");
      expect(skeleton).toBeInTheDocument();
    });
  });
});
