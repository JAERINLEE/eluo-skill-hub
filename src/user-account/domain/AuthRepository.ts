import type { AuthResult } from './AuthResult';

export interface AuthRepository {
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(email: string, password: string): Promise<AuthResult>;
  signOut(): Promise<void>;
  verifyOtp(tokenHash: string, type: string): Promise<AuthResult>;
}
