import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

const FROM = `"Nahian Fashion" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.NEXT_PUBLIC_SITE_DOMAIN}`;

export async function sendCustomerPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${SITE_URL}/account-reset-password?token=${token}`;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Reset your Nahian Fashion password',
    html: `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#333;">
        <h1 style="font-size:28px;color:#ac8545;margin-bottom:8px;">Nahian Fashion</h1>
        <p style="font-size:14px;color:#888;margin-bottom:32px;text-transform:uppercase;letter-spacing:2px;">Premium Tea</p>
        <h2 style="font-size:22px;font-weight:bold;margin-bottom:16px;">Reset Your Password</h2>
        <p style="font-size:16px;line-height:1.6;margin-bottom:24px;">
          We received a request to reset the password for your Nahian Fashion account.<br>
          Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.
        </p>
        <a href="${resetUrl}" style="display:inline-block;background:#ac8545;color:#fff;text-decoration:none;padding:14px 32px;font-size:15px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">
          Reset Password
        </a>
        <p style="margin-top:28px;font-size:13px;color:#999;line-height:1.6;">
          If you did not request a password reset, you can safely ignore this email.<br>
          This link will expire in 1 hour.
        </p>
        <p style="margin-top:16px;font-size:12px;color:#bbb;">
          Or copy this URL: <a href="${resetUrl}" style="color:#ac8545;">${resetUrl}</a>
        </p>
      </div>
    `,
  });
}

export async function sendAdminPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${SITE_URL}/admin/reset-password?token=${token}`;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Admin Password Reset — Nahian Fashion CMS',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#0f1117;color:#e2e8f0;border-radius:8px;">
        <h1 style="font-size:20px;color:#fff;margin-bottom:4px;">Nahian Fashion CMS</h1>
        <p style="font-size:12px;color:#64748b;margin-bottom:32px;text-transform:uppercase;letter-spacing:2px;">Admin Panel</p>
        <h2 style="font-size:20px;font-weight:bold;margin-bottom:16px;color:#fff;">Reset Admin Password</h2>
        <p style="font-size:15px;line-height:1.6;margin-bottom:24px;color:#94a3b8;">
          A password reset was requested for your admin account.<br>
          Click the button below to set a new password. This link expires in <strong style="color:#fff;">1 hour</strong>.
        </p>
        <a href="${resetUrl}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:14px 32px;font-size:14px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;border-radius:6px;">
          Reset Password
        </a>
        <p style="margin-top:28px;font-size:12px;color:#64748b;line-height:1.6;">
          If you did not request this, please ignore this email and ensure your account is secure.<br>
          Link expires in 1 hour.
        </p>
        <p style="margin-top:12px;font-size:11px;color:#475569;">
          URL: <a href="${resetUrl}" style="color:#3b82f6;">${resetUrl}</a>
        </p>
      </div>
    `,
  });
}
