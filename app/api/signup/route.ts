import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mailer";
import { generateVerificationCode, VERIFICATION_CODE_TTL_MS } from "@/lib/tokens";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const code = generateVerificationCode();
  const verificationCodeExpiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      verificationCode: code,
      verificationCodeExpiresAt
    }
  });

  try {
    await sendVerificationEmail(email, code);
  } catch (err) {
    console.error("Failed to send verification email:", err);
    return NextResponse.json(
      {
        error:
          "Account created, but we couldn't send the verification email. Contact support or try resending the code."
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
