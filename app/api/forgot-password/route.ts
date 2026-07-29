import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { generateResetToken, RESET_TOKEN_TTL_MS } from "@/lib/tokens";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  const genericResponse = NextResponse.json({
    ok: true,
    message: "If an account exists for that email, a reset link is on its way."
  });

  // Same response whether or not the account exists — prevents email enumeration.
  if (!user || !user.passwordHash) {
    return genericResponse;
  }

  const resetToken = generateResetToken();
  const resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiresAt }
  });

  const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "";
  const resetUrl = `${origin}/reset-password?token=${resetToken}`;

  try {
    await sendPasswordResetEmail(email, resetUrl);
  } catch (err) {
    console.error("Failed to send password reset email:", err);
    // Still return the generic response — don't reveal delivery failure to the client.
  }

  return genericResponse;
}
