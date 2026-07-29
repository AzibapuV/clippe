import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6)
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the 6-digit code" }, { status: 400 });
  }

  const { email, code } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ error: "No account found for that email" }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  if (!user.verificationCode || !user.verificationCodeExpiresAt) {
    return NextResponse.json(
      { error: "No verification code is pending. Request a new one." },
      { status: 400 }
    );
  }

  if (user.verificationCodeExpiresAt < new Date()) {
    return NextResponse.json(
      { error: "That code has expired. Request a new one." },
      { status: 400 }
    );
  }

  if (user.verificationCode !== code) {
    return NextResponse.json({ error: "Incorrect code" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      verificationCode: null,
      verificationCodeExpiresAt: null
    }
  });

  return NextResponse.json({ ok: true });
}
