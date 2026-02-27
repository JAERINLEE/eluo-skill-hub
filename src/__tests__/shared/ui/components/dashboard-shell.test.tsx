import { render, screen, fireEvent } from "@testing-library/react";
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

// 하위 컴포넌트를 모킹하여 DashboardShell 자체 로직에 집중한다
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

jest.mock("@/shared/ui/components/app-header", () => ({
  AppHeader: ({
    pageTitle,
    isMobile,
  }: {
    pageTitle: string;
    isMobile: boolean;
  }) => (
    <header data-testid="app-header" data-title={pageTitle} data-mobile={isMobile}>
      헤더
    </header>
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

describe("DashboardShell", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDashboardState.mockReturnValue(createMockState());
  });

  it("nav, header, main 시맨틱 요소를 포함하는 3분할 레이아웃을 렌더링한다", () => {
    render(<DashboardShell userEmail="" />);

    expect(
      screen.getByRole("navigation", { name: "메인 내비게이션" })
    ).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("isMobileMenuOpen이 true이고 isMobile이 true일 때 모바일 오버레이를 렌더링한다", () => {
    mockUseDashboardState.mockReturnValue(
      createMockState({ isMobileMenuOpen: true, isMobile: true })
    );

    render(<DashboardShell userEmail="" />);

    const overlay = screen.getByTestId("mobile-overlay");
    expect(overlay).toBeInTheDocument();
    expect(overlay.className).toContain("fixed");
    expect(overlay.className).toContain("inset-0");
    expect(overlay.className).toContain("bg-black/50");
    expect(overlay.className).toContain("z-30");
  });

  it("isMobileMenuOpen이 false일 때 모바일 오버레이를 렌더링하지 않는다", () => {
    mockUseDashboardState.mockReturnValue(
      createMockState({ isMobileMenuOpen: false, isMobile: true })
    );

    render(<DashboardShell userEmail="" />);

    expect(screen.queryByTestId("mobile-overlay")).not.toBeInTheDocument();
  });

  it("isMobile이 false일 때 모바일 오버레이를 렌더링하지 않는다 (데스크톱 모드)", () => {
    mockUseDashboardState.mockReturnValue(
      createMockState({ isMobileMenuOpen: true, isMobile: false })
    );

    render(<DashboardShell userEmail="" />);

    expect(screen.queryByTestId("mobile-overlay")).not.toBeInTheDocument();
  });

  it("오버레이 클릭 시 closeMobileMenu를 호출한다", () => {
    const closeMobileMenu = jest.fn();
    mockUseDashboardState.mockReturnValue(
      createMockState({
        isMobileMenuOpen: true,
        isMobile: true,
        closeMobileMenu,
      })
    );

    render(<DashboardShell userEmail="" />);

    const overlay = screen.getByTestId("mobile-overlay");
    fireEvent.click(overlay);

    expect(closeMobileMenu).toHaveBeenCalledTimes(1);
  });

  it("h-screen 클래스가 적용되어 전체 뷰포트 높이를 사용한다", () => {
    const { container } = render(<DashboardShell userEmail="" />);

    const rootDiv = container.firstElementChild;
    expect(rootDiv).not.toBeNull();
    expect(rootDiv!.className).toContain("h-screen");
  });

  it("flex 레이아웃 클래스가 적용되어 있다", () => {
    const { container } = render(<DashboardShell userEmail="" />);

    const rootDiv = container.firstElementChild;
    expect(rootDiv).not.toBeNull();
    expect(rootDiv!.className).toContain("flex");
  });

  it("메인 콘텐츠 영역에 md:ml-64 클래스가 적용되어 사이드바 오른쪽에 배치된다", () => {
    const { container } = render(<DashboardShell userEmail="" />);

    // md:ml-64 클래스를 가진 콘텐츠 래퍼를 확인한다
    const contentWrapper = container.querySelector(".md\\:ml-64");
    expect(contentWrapper).toBeInTheDocument();
  });

  it("useDashboardState 훅의 상태를 하위 컴포넌트에 props로 전달한다", () => {
    mockUseDashboardState.mockReturnValue(
      createMockState({
        selectedCategory: "디자인",
        pageTitle: "디자인",
        isMobile: true,
      })
    );

    render(<DashboardShell userEmail="" />);

    const sidebar = screen.getByTestId("app-sidebar");
    expect(sidebar).toHaveAttribute("data-selected", "디자인");

    const header = screen.getByTestId("app-header");
    expect(header).toHaveAttribute("data-title", "디자인");
    expect(header).toHaveAttribute("data-mobile", "true");

    const mainContent = screen.getByTestId("main-content");
    expect(mainContent).toHaveAttribute("data-selected", "디자인");
  });
});
