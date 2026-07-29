const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

interface BrevoEmailParams {
  to: string;
  subject: string;
  text: string;
  html: string;
}

async function sendViaBrevo({ to, subject, text, html }: BrevoEmailParams) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    throw new Error(
      "Email isn't configured — set BREVO_API_KEY and BREVO_SENDER_EMAIL in your environment."
    );
  }

  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": apiKey
    },
    body: JSON.stringify({
      sender: { name: "Clippers Creator", email: senderEmail },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html
    })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo API error (${res.status}): ${body}`);
  }
}

export async function sendVerificationEmail(to: string, code: string) {
  await sendViaBrevo({
    to,
    subject: `${code} is your Clippers Creator verification code`,
    text: `Your verification code is ${code}. It expires in 15 minutes.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="margin-bottom: 8px;">Verify your email</h2>
        <p style="color: #555;">Enter this code to finish creating your Clippers Creator account:</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; margin: 24px 0;">${code}</p>
        <p style="color: #888; font-size: 13px;">This code expires in 15 minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await sendViaBrevo({
    to,
    subject: "Reset your Clippers Creator password",
    text: `Reset your password: ${resetUrl} (expires in 1 hour)`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="margin-bottom: 8px;">Reset your password</h2>
        <p style="color: #555;">Click the button below to set a new password. This link expires in 1 hour.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #f04438; color: #111; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Reset password
          </a>
        </p>
        <p style="color: #888; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `
  });
}
