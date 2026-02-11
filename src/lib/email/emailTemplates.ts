/**
 * Email Templates
 *
 * HTML email templates for various transactional emails.
 * These templates follow email best practices with inline styles for compatibility.
 */

import { emailConfig } from "./emailConfig";

/**
 * Base email template wrapper with consistent styling
 */
function baseTemplate(content: string, previewText: string = ""): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${emailConfig.appName}</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .email-container { max-width: 600px; margin: 0 auto; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a;">
  ${previewText ? `<div style="display: none; max-height: 0; overflow: hidden;">${previewText}</div>` : ""}
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0a0a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);">
          <tr>
            <td style="padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
              <img src="${emailConfig.logoUrl}" alt="${emailConfig.appName}" style="height: 48px; width: auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <p style="margin: 0 0 8px; color: rgba(255, 255, 255, 0.5); font-size: 12px;">
                &copy; ${year} ${emailConfig.appName}. All rights reserved.
              </p>
              <p style="margin: 0; color: rgba(255, 255, 255, 0.4); font-size: 11px;">
                Questions? Contact us at <a href="mailto:${emailConfig.supportEmail}" style="color: #f97316;">support</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Button component for emails
 */
function emailButton(text: string, url: string, color: string = "#f97316"): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px auto;">
      <tr>
        <td style="border-radius: 8px; background: ${color};">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>`;
}

/**
 * Email Verification Template
 */
export function verificationEmailTemplate(verificationLink: string): string {
  const content = `<div style="text-align: center;">
      <div style="width: 64px; height: 64px; margin: 0 auto 24px; background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 50%; line-height: 64px;">
        <span style="font-size: 32px;">&#9993;</span>
      </div>
      <h1 style="margin: 0 0 16px; color: #ffffff; font-size: 28px; font-weight: 700;">
        Email Verification Required
      </h1>
      <p style="margin: 0 0 8px; color: rgba(255, 255, 255, 0.8); font-size: 16px; line-height: 1.6;">
        Welcome to ${emailConfig.appName}!
      </p>
      <p style="margin: 0 0 32px; color: rgba(255, 255, 255, 0.7); font-size: 15px; line-height: 1.6;">
        Please verify your email address to access all features.
      </p>
      ${emailButton("Verify Email", verificationLink)}
      <p style="margin: 24px 0 0; color: rgba(255, 255, 255, 0.5); font-size: 13px;">
        This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
      </p>
    </div>`;
  return baseTemplate(content, `Verify your email for ${emailConfig.appName}`);
}

/**
 * Password Reset Email Template
 */
export function passwordResetEmailTemplate(resetLink: string): string {
  const content = `<div style="text-align: center;">
      <div style="width: 64px; height: 64px; margin: 0 auto 24px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 50%; line-height: 64px;">
        <span style="font-size: 32px;">&#128274;</span>
      </div>
      <h1 style="margin: 0 0 16px; color: #ffffff; font-size: 28px; font-weight: 700;">
        Reset Your Password
      </h1>
      <p style="margin: 0 0 32px; color: rgba(255, 255, 255, 0.7); font-size: 15px; line-height: 1.6;">
        We received a request to reset your password. Click the button below to create a new password.
      </p>
      ${emailButton("Reset Password", resetLink, "#3b82f6")}
      <p style="margin: 24px 0 0; color: rgba(255, 255, 255, 0.5); font-size: 13px;">
        This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>`;
  return baseTemplate(content, `Reset your ${emailConfig.appName} password`);
}

/**
 * Welcome Email Template
 */
export function welcomeEmailTemplate(userName: string): string {
  const content = `<div style="text-align: center;">
      <div style="width: 64px; height: 64px; margin: 0 auto 24px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; line-height: 64px;">
        <span style="font-size: 32px;">&#127881;</span>
      </div>
      <h1 style="margin: 0 0 16px; color: #ffffff; font-size: 28px; font-weight: 700;">
        Welcome to ${emailConfig.appName}!
      </h1>
      <p style="margin: 0 0 8px; color: rgba(255, 255, 255, 0.8); font-size: 16px; line-height: 1.6;">
        Hi ${userName},
      </p>
      <p style="margin: 0 0 24px; color: rgba(255, 255, 255, 0.7); font-size: 15px; line-height: 1.6;">
        Your account has been verified and you're all set to explore ${emailConfig.appName}'s features.
      </p>
      <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: left;">
        <h3 style="margin: 0 0 16px; color: #f97316; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">What's Next?</h3>
        <ul style="margin: 0; padding: 0 0 0 20px; color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 2;">
          <li>Secure access to your health data</li>
          <li>Enable cloud backup and sync</li>
          <li>Receive important notifications</li>
          <li>Access premium features</li>
        </ul>
      </div>
      ${emailButton("Get Started", emailConfig.appUrl, "#10b981")}
    </div>`;
  return baseTemplate(content, `Welcome to ${emailConfig.appName}, ${userName}!`);
}

/**
 * Notification Email Template
 */
export function notificationEmailTemplate(subject: string, content: string): string {
  const emailContent = `<div>
      <h1 style="margin: 0 0 24px; color: #ffffff; font-size: 24px; font-weight: 700;">
        ${subject}
      </h1>
      <div style="color: rgba(255, 255, 255, 0.8); font-size: 15px; line-height: 1.7;">
        ${content}
      </div>
      <div style="margin-top: 32px; text-align: center;">
        ${emailButton("View in App", emailConfig.appUrl, "#6366f1")}
      </div>
    </div>`;
  return baseTemplate(emailContent, subject);
}

/**
 * Partner Invite Email Template
 */
export function partnerInviteEmailTemplate(inviterName: string, inviteLink: string): string {
  const content = `<div style="text-align: center;">
      <div style="width: 64px; height: 64px; margin: 0 auto 24px; background: linear-gradient(135deg, #ec4899, #db2777); border-radius: 50%; line-height: 64px;">
        <span style="font-size: 32px;">&#128149;</span>
      </div>
      <h1 style="margin: 0 0 16px; color: #ffffff; font-size: 28px; font-weight: 700;">
        You've Been Invited!
      </h1>
      <p style="margin: 0 0 8px; color: rgba(255, 255, 255, 0.8); font-size: 16px; line-height: 1.6;">
        <strong style="color: #f97316;">${inviterName}</strong> has invited you to connect as a partner on ${emailConfig.appName}.
      </p>
      <p style="margin: 0 0 32px; color: rgba(255, 255, 255, 0.7); font-size: 15px; line-height: 1.6;">
        Accept the invitation to share data and track progress together.
      </p>
      ${emailButton("Accept Invitation", inviteLink, "#ec4899")}
      <p style="margin: 24px 0 0; color: rgba(255, 255, 255, 0.5); font-size: 13px;">
        This invitation will expire in 7 days. If you don't know this person, you can safely ignore this email.
      </p>
    </div>`;
  return baseTemplate(content, `${inviterName} invited you to ${emailConfig.appName}`);
}
