"use client";

import { useState, useCallback } from "react";
import { User, LogOut, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/shared/ui/components/popover";
import { Button } from "@/shared/ui/components/button";
import { logoutAction } from "@/app/actions/auth";

interface UserProfilePopoverProps {
  readonly userEmail: string;
}

interface UserProfilePopoverState {
  isLoggingOut: boolean;
  logoutError: string | null;
}

export function UserProfilePopover({ userEmail }: UserProfilePopoverProps) {
  const [state, setState] = useState<UserProfilePopoverState>({
    isLoggingOut: false,
    logoutError: null,
  });

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      // 팝오버가 닫히면 에러 상태를 초기화한다
      setState((prev) => ({
        ...prev,
        logoutError: null,
      }));
    }
  }, []);

  const handleLogout = useCallback(async () => {
    if (state.isLoggingOut) return;

    setState((prev) => ({
      ...prev,
      isLoggingOut: true,
      logoutError: null,
    }));

    const result = await logoutAction();

    if (result && result.status === "error") {
      setState({
        isLoggingOut: false,
        logoutError: result.message,
      });
    }
  }, [state.isLoggingOut]);

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="프로필 메뉴"
          className="rounded-full bg-muted h-8 w-8"
        >
          <User className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <div className="flex items-center justify-center rounded-full bg-muted h-8 w-8 shrink-0">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm truncate">{userEmail}</span>
          </div>
          <div className="border-t border-border" />
          {state.logoutError && (
            <p className="text-sm text-destructive px-1">
              {state.logoutError}
            </p>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={state.isLoggingOut}
            className="w-full justify-start gap-2"
          >
            {state.isLoggingOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>로그아웃 중...</span>
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                <span>로그아웃</span>
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
