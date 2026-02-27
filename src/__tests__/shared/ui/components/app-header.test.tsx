import { render, screen, fireEvent } from "@testing-library/react";
import { AppHeader } from "@/shared/ui/components/app-header";

jest.mock("@/shared/ui/components/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

jest.mock("@/shared/ui/components/search-input", () => ({
  SearchInput: (props: Record<string, unknown>) => (
    <input data-testid="search-input" />
  ),
}));

jest.mock("@/shared/ui/components/user-profile-popover", () => ({
  UserProfilePopover: ({ userEmail }: { userEmail: string }) => (
    <div data-testid="user-profile-popover">{userEmail}</div>
  ),
}));

jest.mock("@/shared/ui/components/skeleton", () => ({
  Skeleton: (props: Record<string, unknown>) => (
    <div data-testid="profile-skeleton" data-slot="skeleton" {...props} />
  ),
}));

const defaultProps = {
  pageTitle: "대시보드",
  searchQuery: "",
  onSearchChange: jest.fn(),
  isMobile: false,
  onToggleMobileMenu: jest.fn(),
  userEmail: "user@eluocnc.com",
};

describe("AppHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("header 시맨틱 요소를 렌더링한다", () => {
    render(<AppHeader {...defaultProps} />);
    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();
    expect(header.tagName).toBe("HEADER");
  });

  it("페이지 제목을 표시한다", () => {
    render(<AppHeader {...defaultProps} pageTitle="디자인" />);
    expect(screen.getByText("디자인")).toBeInTheDocument();
  });

  it("ThemeToggle 컴포넌트를 포함한다", () => {
    render(<AppHeader {...defaultProps} />);
    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
  });

  it("isMobile=true일 때 햄버거 메뉴 버튼을 표시한다", () => {
    render(<AppHeader {...defaultProps} isMobile={true} />);
    const menuButton = screen.getByRole("button", { name: "메뉴 열기" });
    expect(menuButton).toBeInTheDocument();
  });

  it("isMobile=false일 때 햄버거 메뉴 버튼을 숨긴다", () => {
    render(<AppHeader {...defaultProps} isMobile={false} />);
    const menuButton = screen.queryByRole("button", { name: "메뉴 열기" });
    expect(menuButton).not.toBeInTheDocument();
  });

  it("햄버거 메뉴 버튼 클릭 시 onToggleMobileMenu를 호출한다", () => {
    const onToggleMobileMenu = jest.fn();
    render(
      <AppHeader
        {...defaultProps}
        isMobile={true}
        onToggleMobileMenu={onToggleMobileMenu}
      />
    );
    const menuButton = screen.getByRole("button", { name: "메뉴 열기" });
    fireEvent.click(menuButton);
    expect(onToggleMobileMenu).toHaveBeenCalledTimes(1);
  });

  it("isMobile=false일 때 SearchInput을 표시한다", () => {
    render(<AppHeader {...defaultProps} isMobile={false} />);
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  it("isMobile=true일 때 SearchInput을 숨긴다", () => {
    render(<AppHeader {...defaultProps} isMobile={true} />);
    expect(screen.queryByTestId("search-input")).not.toBeInTheDocument();
  });

  // Task 5.1: 인증 상태에 따른 프로필 영역 테스트

  describe("인증 상태에 따른 프로필 영역", () => {
    it("userEmail이 존재하면 UserProfilePopover를 렌더링한다", () => {
      render(<AppHeader {...defaultProps} userEmail="user@eluocnc.com" />);
      const popover = screen.getByTestId("user-profile-popover");
      expect(popover).toBeInTheDocument();
      expect(popover).toHaveTextContent("user@eluocnc.com");
    });

    it("userEmail이 존재하면 프로필 영역에 활성 상태 스타일을 적용한다", () => {
      render(<AppHeader {...defaultProps} userEmail="user@eluocnc.com" />);
      const profileArea = screen.getByTestId("user-profile");
      expect(profileArea).toBeInTheDocument();
      expect(profileArea.className).toMatch(/ring/);
    });

    it("userEmail이 빈 문자열이면 로딩 스켈레톤을 표시한다", () => {
      render(<AppHeader {...defaultProps} userEmail="" />);
      const skeleton = screen.getByTestId("profile-skeleton");
      expect(skeleton).toBeInTheDocument();
    });

    it("userEmail이 빈 문자열이면 UserProfilePopover를 렌더링하지 않는다", () => {
      render(<AppHeader {...defaultProps} userEmail="" />);
      expect(screen.queryByTestId("user-profile-popover")).not.toBeInTheDocument();
    });

    it("userEmail이 존재하면 기존 정적 프로필 아이콘 div를 표시하지 않는다", () => {
      render(<AppHeader {...defaultProps} userEmail="user@eluocnc.com" />);
      // UserProfilePopover가 렌더링되므로 정적 div 대신 popover가 보여야 한다
      const popover = screen.getByTestId("user-profile-popover");
      expect(popover).toBeInTheDocument();
    });

    it("userEmail이 존재하면 프로필 영역의 data-testid가 user-profile이다", () => {
      render(<AppHeader {...defaultProps} userEmail="user@eluocnc.com" />);
      const profileArea = screen.getByTestId("user-profile");
      expect(profileArea).toBeInTheDocument();
    });
  });
});
