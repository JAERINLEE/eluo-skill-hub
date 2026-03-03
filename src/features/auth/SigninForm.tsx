"use client";

import { useActionState, useState } from "react";
import { signin } from "@/app/signin/actions";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import type { SigninActionState } from "@/auth/domain/types";

const initialState: SigninActionState = { error: "" };

interface ValidationErrors {
  email?: string;
  password?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SigninForm() {
  const [state, formAction, isPending] = useActionState(signin, initialState);
  const [serverErrorVisible, setServerErrorVisible] = useState(true);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const handleInputChange = () => {
    setServerErrorVisible(false);
  };

  const validate = (formData: FormData): ValidationErrors => {
    const errors: ValidationErrors = {};
    const email = formData.get("email");
    const password = formData.get("password");

    if (typeof email !== "string" || email.trim() === "") {
      errors.email = "이메일을 입력해 주세요";
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = "올바른 이메일 형식을 입력해 주세요";
    }

    if (typeof password !== "string" || password === "") {
      errors.password = "비밀번호를 입력해 주세요";
    }

    return errors;
  };

  const handleFormAction = (formData: FormData) => {
    const errors = validate(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors({});
    setServerErrorVisible(true);
    return formAction(formData);
  };

  const showServerError = serverErrorVisible && state.error;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">로그인</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleFormAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="example@email.com"
              autoComplete="email"
              onChange={handleInputChange}
              aria-invalid={!!validationErrors.email}
              aria-describedby={validationErrors.email ? "email-error" : undefined}
            />
            {validationErrors.email && (
              <p id="email-error" className="text-sm text-destructive" role="alert">
                {validationErrors.email}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
              onChange={handleInputChange}
              aria-invalid={!!validationErrors.password}
              aria-describedby={validationErrors.password ? "password-error" : undefined}
            />
            {validationErrors.password && (
              <p id="password-error" className="text-sm text-destructive" role="alert">
                {validationErrors.password}
              </p>
            )}
          </div>
          {showServerError && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
