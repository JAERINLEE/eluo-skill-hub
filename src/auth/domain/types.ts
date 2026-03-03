export interface SigninCredentials {
  readonly email: string;
  readonly password: string;
}

export type SigninResult =
  | { success: true }
  | { success: false; error: string };

export interface SignupCredentials {
  readonly email: string;
  readonly password: string;
  readonly name: string;
}

export type SignupResult =
  | { success: true }
  | { success: "pending" }
  | { success: false; error: string };

export interface VerifyOtpCredentials {
  readonly email: string;
  readonly token: string;
}

export type VerifyOtpResult =
  | { success: true }
  | { success: false; error: string };

export type ResendOtpResult =
  | { success: true }
  | { success: false; error: string; isRateLimited?: boolean };

export interface AuthRepository {
  signIn(credentials: SigninCredentials): Promise<SigninResult>;
  signUp(credentials: SignupCredentials): Promise<SignupResult>;
  verifyOtp(credentials: VerifyOtpCredentials): Promise<VerifyOtpResult>;
  resendOtp(email: string): Promise<ResendOtpResult>;
}

export interface SigninActionState {
  error: string;
}

export interface SignupActionState {
  error: string;
  step: "form" | "verify" | "duplicate";
  email: string;
}

export interface VerifyOtpActionState {
  error: string;
}

export interface ResendOtpActionState {
  error: string;
  success: boolean;
  isRateLimited: boolean;
}
