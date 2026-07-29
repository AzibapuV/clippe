import { randomInt, randomBytes } from "crypto";

export function generateVerificationCode(): string {
  return randomInt(100000, 999999).toString();
}

export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

export const VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
