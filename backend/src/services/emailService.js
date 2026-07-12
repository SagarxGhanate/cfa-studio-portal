const { Resend } = require('resend');

// Initialize Resend only if API key is provided
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Send a password reset OTP email.
 * Falls back to console.log if RESEND_API_KEY is not configured.
 */
const sendOtpEmail = async (to, otp, name) => {
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0e0e0e; border-radius: 16px; overflow: hidden; border: 1px solid #222;">
      <div style="padding: 32px 28px 20px; text-align: center;">
        <h1 style="color: #f97316; font-size: 28px; font-weight: 900; margin: 0 0 4px; font-style: italic; letter-spacing: -1px;">CFA</h1>
        <p style="color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; margin: 0;">Studio Admin Portal</p>
      </div>
      <div style="padding: 0 28px 32px;">
        <h2 style="color: #e5e2e1; font-size: 20px; font-weight: 700; margin: 0 0 8px;">Password Reset</h2>
        <p style="color: #888; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          Hi ${name || 'there'}, here's your one-time password to reset your account:
        </p>
        <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #f97316; font-family: monospace;">${otp}</span>
        </div>
        <p style="color: #666; font-size: 12px; line-height: 1.5; margin: 0;">
          This OTP expires in <strong style="color: #e5e2e1;">10 minutes</strong>. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
      <div style="padding: 16px 28px; border-top: 1px solid #222; text-align: center;">
        <p style="color: #444; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin: 0;">© ${new Date().getFullYear()} CFA — Calisthenics For All</p>
      </div>
    </div>
  `;

  if (!resend) {
    console.log('═══════════════════════════════════════════');
    console.log(`  📧 OTP for ${to}: ${otp}`);
    console.log('  (Set RESEND_API_KEY in .env to send real emails)');
    console.log('═══════════════════════════════════════════');
    return { success: true, fallback: true };
  }

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'CFA Studio <onboarding@resend.dev>',
      to,
      subject: `${otp} — Your CFA Password Reset Code`,
      html,
    });
    return { success: true, data: result };
  } catch (err) {
    console.error('Email send error:', err.message);
    // Fallback to console so the flow doesn't break
    console.log(`  📧 OTP fallback for ${to}: ${otp}`);
    return { success: true, fallback: true };
  }
};

/**
 * Send a new temporary password & OWNER access notification email.
 */
const sendNewPasswordEmail = async (to, newPassword, name) => {
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0e0e0e; border-radius: 16px; overflow: hidden; border: 1px solid #222;">
      <div style="padding: 32px 28px 20px; text-align: center;">
        <h1 style="color: #8B5CF6; font-size: 28px; font-weight: 900; margin: 0 0 4px; letter-spacing: -1px;">PINNACLE / CFA</h1>
        <p style="color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; margin: 0;">Studio Admin Portal</p>
      </div>
      <div style="padding: 0 28px 32px;">
        <h2 style="color: #e5e2e1; font-size: 20px; font-weight: 700; margin: 0 0 8px;">Account Access & New Password</h2>
        <p style="color: #888; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          Hi ${name || 'there'}, your password has been reset and your account has been granted full <strong style="color: #8B5CF6;">OWNER</strong> access.
        </p>
        <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <p style="color: #666; font-size: 12px; margin: 0 0 8px;">YOUR NEW LOGIN PASSWORD</p>
          <span style="font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #8B5CF6; font-family: monospace;">${newPassword}</span>
        </div>
        <p style="color: #666; font-size: 12px; line-height: 1.5; margin: 0;">
          You can now return to the login screen and sign in using your email (<strong style="color: #e5e2e1;">${to}</strong>) and this new password.
        </p>
      </div>
      <div style="padding: 16px 28px; border-top: 1px solid #222; text-align: center;">
        <p style="color: #444; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin: 0;">© ${new Date().getFullYear()} Studio Portal</p>
      </div>
    </div>
  `;

  if (!resend) {
    console.log('═══════════════════════════════════════════');
    console.log(`  🔑 NEW PASSWORD FOR ${to}: ${newPassword} (OWNER ACCESS)`);
    console.log('  (Set RESEND_API_KEY in .env to send real emails)');
    console.log('═══════════════════════════════════════════');
    return { success: true, fallback: true };
  }

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'CFA Studio <onboarding@resend.dev>',
      to,
      subject: `Your New Password & Owner Access — Studio Portal`,
      html,
    });
    return { success: true, data: result };
  } catch (err) {
    console.error('Email send error:', err.message);
    console.log(`  🔑 NEW PASSWORD FALLBACK FOR ${to}: ${newPassword}`);
    return { success: true, fallback: true };
  }
};

module.exports = { sendOtpEmail, sendNewPasswordEmail };
