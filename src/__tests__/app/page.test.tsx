import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

// createSupabaseServerClient 모킹
const mockGetUser = jest.fn();
jest.mock("@/shared/infrastructure/supabase/server", () => ({
  createSupabaseServerClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
}));

// DashboardShell을 모킹하여 전달된 props를 검증한다
jest.mock("@/shared/ui/components/dashboard-shell", () => ({
  DashboardShell: ({ userEmail }: { userEmail?: string }) => (
    <div data-testid="dashboard-shell" data-user-email={userEmail ?? ""}>
      DashboardShell
    </div>
  ),
}));

describe("Home (page.tsx) - 서버 컴포넌트 인증 정보 전달", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createSupabaseServerClient를 호출하여 사용자 정보를 조회한다", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "test-uuid",
          email: "user@eluocnc.com",
          app_metadata: {},
          user_metadata: {},
          aud: "authenticated",
          created_at: "2024-01-01",
        },
      },
      error: null,
    });

    const Page = await Home();
    render(Page);

    expect(mockGetUser).toHaveBeenCalledTimes(1);
  });

  it("사용자 이메일만 추출하여 DashboardShell에 userEmail props로 전달한다", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "test-uuid",
          email: "user@eluocnc.com",
          app_metadata: { provider: "email" },
          user_metadata: { name: "Test User" },
          aud: "authenticated",
          created_at: "2024-01-01",
        },
      },
      error: null,
    });

    const Page = await Home();
    render(Page);

    const dashboardShell = screen.getByTestId("dashboard-shell");
    expect(dashboardShell).toHaveAttribute("data-user-email", "user@eluocnc.com");
  });

  it("민감한 데이터(토큰, 비밀번호 등)는 DashboardShell에 전달하지 않는다", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "test-uuid",
          email: "user@eluocnc.com",
          app_metadata: { provider: "email" },
          user_metadata: { name: "Test User" },
          aud: "authenticated",
          created_at: "2024-01-01",
          access_token: "secret-access-token",
          refresh_token: "secret-refresh-token",
        },
      },
      error: null,
    });

    const Page = await Home();
    render(Page);

    const dashboardShell = screen.getByTestId("dashboard-shell");
    // DashboardShell에는 이메일만 전달되어야 하며, 민감 데이터 속성이 없어야 한다
    expect(dashboardShell).toHaveAttribute("data-user-email", "user@eluocnc.com");
    // 민감 데이터가 HTML에 노출되지 않는지 확인
    expect(dashboardShell.outerHTML).not.toContain("secret-access-token");
    expect(dashboardShell.outerHTML).not.toContain("secret-refresh-token");
  });

  it("getUser 실패 시 빈 문자열을 DashboardShell에 전달한다", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Auth error" },
    });

    const Page = await Home();
    render(Page);

    const dashboardShell = screen.getByTestId("dashboard-shell");
    expect(dashboardShell).toHaveAttribute("data-user-email", "");
  });
});
