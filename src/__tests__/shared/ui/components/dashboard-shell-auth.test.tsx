import { render, screen } from "@testing-library/react";
import { DashboardShell } from "@/shared/ui/components/dashboard-shell";
import { useDashboardState } from "@/shared/ui/hooks/use-dashboard-state";
import type {
  DashboardState,
  DashboardActions,
} from "@/shared/ui/types/dashboard";

// useDashboardState 훅을 모킹하여 상태를 테스트에서 제어한다
jest.mock("@/shared/ui/hooks/use-dashboard-state", () => ({
  useDashboardState: jest.fn(),
}));

// AppHeader를 모킹하여 전달된 userEmail props를 캡처한다
jest.mock("@/shared/ui/components/app-header", () => ({
  AppHeader: ({
    pageTitle,
    isMobile,
    userEmail,
  }: {
    pageTitle: string;
    isMobile: boolean;
    userEmail?: string;
  }) => (
    <header
      data-testid="app-header"
      data-title={pageTitle}
      data-mobile={isMobile}
      data-user-email={userEmail ?? ""}
    >
      헤더
    </header>
  ),
}));

jest.mock("@/shared/ui/components/app-sidebar", () => ({
  AppSidebar: ({
    selectedCategory,
    isMobileMenuOpen,
  }: {
    selectedCategory: string;
    isMobileMenuOpen: boolean;
  }) => (
    <nav
      aria-label="메인 내비게이션"
      data-testid="app-sidebar"
      data-selected={selectedCategory}
      data-mobile-open={isMobileMenuOpen}
    >
      사이드바
    </nav>
  ),
}));

jest.mock("@/shared/ui/components/main-content", () => ({
  MainContent: ({
    selectedCategory,
  }: {
    selectedCategory: string;
  }) => (
    <main data-testid="main-content" data-selected={selectedCategory}>
      메인 콘텐츠
    </main>
  ),
}));

const mockUseDashboardState = useDashboardState as jest.MockedFunction<
  typeof useDashboardState
>;

function createMockState(
  overrides: Partial<DashboardState & DashboardActions> = {}
): DashboardState & DashboardActions {
  return {
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
    ...overrides,
  };
}

describe("DashboardShell - userEmail props 전달", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDashboardState.mockReturnValue(createMockState());
  });

  it("userEmail props를 수신하여 AppHeader에 전달한다", () => {
    render(<DashboardShell userEmail="user@eluocnc.com" />);

    const header = screen.getByTestId("app-header");
    expect(header).toHaveAttribute("data-user-email", "user@eluocnc.com");
  });

  it("userEmail이 빈 문자열일 때도 AppHeader에 그대로 전달한다", () => {
    render(<DashboardShell userEmail="" />);

    const header = screen.getByTestId("app-header");
    expect(header).toHaveAttribute("data-user-email", "");
  });

  it("기존 대시보드 상태 관리 훅(useDashboardState)이 정상적으로 호출된다", () => {
    render(<DashboardShell userEmail="user@eluocnc.com" />);

    expect(mockUseDashboardState).toHaveBeenCalledTimes(1);
  });

  it("기존 컴포넌트 구조(sidebar, header, main)가 유지된다", () => {
    render(<DashboardShell userEmail="user@eluocnc.com" />);

    expect(screen.getByTestId("app-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("app-header")).toBeInTheDocument();
    expect(screen.getByTestId("main-content")).toBeInTheDocument();
  });

  it("useDashboardState 훅의 다른 props도 AppHeader에 정상 전달된다", () => {
    mockUseDashboardState.mockReturnValue(
      createMockState({ pageTitle: "디자인", isMobile: true })
    );

    render(<DashboardShell userEmail="user@eluocnc.com" />);

    const header = screen.getByTestId("app-header");
    expect(header).toHaveAttribute("data-title", "디자인");
    expect(header).toHaveAttribute("data-mobile", "true");
    expect(header).toHaveAttribute("data-user-email", "user@eluocnc.com");
  });
});
