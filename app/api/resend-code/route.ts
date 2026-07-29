import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mailer";
import { generateVerificationCode, VERIFICATION_CODE_TTL_MS } from "@/lib/tokens";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Don't reveal whether the account exists — same generic response either way.
  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true });
  }

  const code = generateVerificationCode();
  const verificationCodeExpiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);

  await prisma.user.update({
    where: { id: user.id },
    data: { verificationCode: code, verificationCodeExpiresAt }
  });

  try {
    await sendVerificationEmail(email, code);
  } catch (err) {
    console.error("Failed to resend verification email:", err);
    return NextResponse.json({ error: "Couldn't send the email. Try again shortly." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
