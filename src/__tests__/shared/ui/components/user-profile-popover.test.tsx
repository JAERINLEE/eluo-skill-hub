import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserProfilePopover } from "@/shared/ui/components/user-profile-popover";

// logoutAction 모킹
const mockLogoutAction = jest.fn();
jest.mock("@/app/actions/auth", () => ({
  logoutAction: (...args: unknown[]) => mockLogoutAction(...args),
}));

// Radix UI Popover는 Portal을 사용하므로 jsdom 환경에서 동작하도록 모킹
jest.mock("@/shared/ui/components/popover", () => {
  const React = require("react");

  function Popover({
    children,
    onOpenChange,
    open,
    ...props
  }: {
    children: React.ReactNode;
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
  }) {
    const [isOpen, setIsOpen] = React.useState(open ?? false);

    React.useEffect(() => {
      if (open !== undefined) {
        setIsOpen(open);
      }
    }, [open]);

    const handleOpenChange = (newOpen: boolean) => {
      setIsOpen(newOpen);
      onOpenChange?.(newOpen);
    };

    return (
      <div data-testid="popover-root" data-state={isOpen ? "open" : "closed"}>
        {React.Children.map(children, (child: React.ReactElement) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              "data-popover-open": isOpen,
              onToggle: () => handleOpenChange(!isOpen),
              onClose: () => handleOpenChange(false),
            } as Record<string, unknown>);
          }
          return child;
        })}
      </div>
    );
  }

  function PopoverTrigger({
    children,
    onToggle,
    asChild,
    ...props
  }: {
    children: React.ReactNode;
    onToggle?: () => void;
    asChild?: boolean;
  }) {
    return (
      <div data-testid="popover-trigger" onClick={onToggle} {...props}>
        {children}
      </div>
    );
  }

  function PopoverContent({
    children,
    "data-popover-open": isOpen,
    onClose,
    ...props
  }: {
    children: React.ReactNode;
    "data-popover-open"?: boolean;
    onClose?: () => void;
  }) {
    if (!isOpen) return null;
    return (
      <div data-testid="popover-content" {...props}>
        {children}
      </div>
    );
  }

  return { Popover, PopoverTrigger, PopoverContent };
});

describe("UserProfilePopover", () => {
  const defaultProps = {
    userEmail: "user@eluocnc.com",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("렌더링", () => {
    it("프로필 아이콘 트리거 버튼을 렌더링한다", () => {
      render(<UserProfilePopover {...defaultProps} />);
      const triggerButton = screen.getByRole("button", {
        name: /프로필 메뉴/i,
      });
      expect(triggerButton).toBeInTheDocument();
    });

    it("초기 상태에서 팝오버 콘텐츠는 보이지 않는다", () => {
      render(<UserProfilePopover {...defaultProps} />);
      expect(screen.queryByTestId("popover-content")).not.toBeInTheDocument();
    });
  });

  describe("팝오버 열기/닫기", () => {
    it("프로필 아이콘 클릭 시 팝오버가 열린다", async () => {
      const user = userEvent.setup();
      render(<UserProfilePopover {...defaultProps} />);

      const triggerButton = screen.getByRole("button", {
        name: /프로필 메뉴/i,
      });
      await user.click(triggerButton);

      expect(screen.getByTestId("popover-content")).toBeInTheDocument();
    });

    it("팝오버 내부에 사용자 이메일 주소를 표시한다", async () => {
      const user = userEvent.setup();
      render(<UserProfilePopover {...defaultProps} />);

      const triggerButton = screen.getByRole("button", {
        name: /프로필 메뉴/i,
      });
      await user.click(triggerButton);

      expect(screen.getByText("user@eluocnc.com")).toBeInTheDocument();
    });

    it("팝오버 내부에 로그아웃 버튼을 표시한다", async () => {
      const user = userEvent.setup();
      render(<UserProfilePopover {...defaultProps} />);

      const triggerButton = screen.getByRole("button", {
        name: /프로필 메뉴/i,
      });
      await user.click(triggerButton);

      const logoutButton = screen.getByRole("button", { name: /로그아웃/i });
      expect(logoutButton).toBeInTheDocument();
    });
  });

  describe("로그아웃 기능", () => {
    it("로그아웃 버튼 클릭 시 logoutAction을 호출한다", async () => {
      mockLogoutAction.mockResolvedValue({ status: "success" });
      const user = userEvent.setup();
      render(<UserProfilePopover {...defaultProps} />);

      // 팝오버 열기
      const triggerButton = screen.getByRole("button", {
        name: /프로필 메뉴/i,
      });
      await user.click(triggerButton);

      // 로그아웃 버튼 클릭
      const logoutButton = screen.getByRole("button", { name: /로그아웃/i });
      await user.click(logoutButton);

      expect(mockLogoutAction).toHaveBeenCalledTimes(1);
    });

    it("로그아웃 진행 중에는 로딩 상태를 표시한다", async () => {
      // logoutAction이 resolve되지 않는 Promise를 반환하여 로딩 상태 유지
      mockLogoutAction.mockReturnValue(new Promise(() => {}));
      const user = userEvent.setup();
      render(<UserProfilePopover {...defaultProps} />);

      // 팝오버 열기
      const triggerButton = screen.getByRole("button", {
        name: /프로필 메뉴/i,
      });
      await user.click(triggerButton);

      // 로그아웃 버튼 클릭
      const logoutButton = screen.getByRole("button", { name: /로그아웃/i });
      await user.click(logoutButton);

      // 로딩 상태 확인
      await waitFor(() => {
        expect(screen.getByText(/로그아웃 중/i)).toBeInTheDocument();
      });
    });

    it("로그아웃 진행 중에는 버튼이 비활성화된다", async () => {
      mockLogoutAction.mockReturnValue(new Promise(() => {}));
      const user = userEvent.setup();
      render(<UserProfilePopover {...defaultProps} />);

      // 팝오버 열기
      const triggerButton = screen.getByRole("button", {
        name: /프로필 메뉴/i,
      });
      await user.click(triggerButton);

      // 로그아웃 버튼 클릭
      const logoutButton = screen.getByRole("button", { name: /로그아웃/i });
      await user.click(logoutButton);

      // 버튼 비활성화 확인
      await waitFor(() => {
        const disabledButton = screen.getByRole("button", {
          name: /로그아웃 중/i,
        });
        expect(disabledButton).toBeDisabled();
      });
    });
  });

  describe("에러 처리", () => {
    it("로그아웃 실패 시 팝오버 내부에 오류 메시지를 표시한다", async () => {
      mockLogoutAction.mockResolvedValue({
        status: "error",
        message: "로그아웃 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
      });
      const user = userEvent.setup();
      render(<UserProfilePopover {...defaultProps} />);

      // 팝오버 열기
      const triggerButton = screen.getByRole("button", {
        name: /프로필 메뉴/i,
      });
      await user.click(triggerButton);

      // 로그아웃 버튼 클릭
      const logoutButton = screen.getByRole("button", { name: /로그아웃/i });
      await user.click(logoutButton);

      // 에러 메시지 표시 확인
      await waitFor(() => {
        expect(
          screen.getByText(
            "로그아웃 처리 중 오류가 발생했습니다. 다시 시도해주세요."
          )
        ).toBeInTheDocument();
      });
    });

    it("팝오버가 닫히면 에러 상태가 초기화된다", async () => {
      mockLogoutAction.mockResolvedValue({
        status: "error",
        message: "로그아웃 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
      });
      const user = userEvent.setup();
      render(<UserProfilePopover {...defaultProps} />);

      // 팝오버 열기
      const triggerButton = screen.getByRole("button", {
        name: /프로필 메뉴/i,
      });
      await user.click(triggerButton);

      // 로그아웃 버튼 클릭
      const logoutButton = screen.getByRole("button", { name: /로그아웃/i });
      await user.click(logoutButton);

      // 에러 메시지 표시 확인
      await waitFor(() => {
        expect(
          screen.getByText(
            "로그아웃 처리 중 오류가 발생했습니다. 다시 시도해주세요."
          )
        ).toBeInTheDocument();
      });

      // 팝오버 닫기 (트리거 다시 클릭)
      await user.click(triggerButton);

      // 팝오버 콘텐츠가 사라짐
      expect(screen.queryByTestId("popover-content")).not.toBeInTheDocument();

      // 팝오버 다시 열기
      await user.click(triggerButton);

      // 에러 메시지가 초기화되어 보이지 않음
      expect(
        screen.queryByText(
          "로그아웃 처리 중 오류가 발생했습니다. 다시 시도해주세요."
        )
      ).not.toBeInTheDocument();
    });

    it("로그아웃 실패 후에도 로그아웃 버튼이 다시 활성화된다", async () => {
      mockLogoutAction.mockResolvedValue({
        status: "error",
        message: "로그아웃 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
      });
      const user = userEvent.setup();
      render(<UserProfilePopover {...defaultProps} />);

      // 팝오버 열기
      const triggerButton = screen.getByRole("button", {
        name: /프로필 메뉴/i,
      });
      await user.click(triggerButton);

      // 로그아웃 버튼 클릭
      const logoutButton = screen.getByRole("button", { name: /로그아웃/i });
      await user.click(logoutButton);

      // 에러 메시지 표시 후 버튼이 다시 활성화됨
      await waitFor(() => {
        const reEnabledButton = screen.getByRole("button", {
          name: /로그아웃/i,
        });
        expect(reEnabledButton).not.toBeDisabled();
      });
    });
  });
});
