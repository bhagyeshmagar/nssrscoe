import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import dns from 'dns';

// Force IPv4 resolution to prevent ENETUNREACH errors on IPv6-disabled hosts (like Render)
dns.setDefaultResultOrder('ipv4first');

// ─── Resend (if API key is set) ───────────────────────────────────────────────
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

// ─── Nodemailer / Gmail (free) ─────────────────────────────────────────────────
// Set GMAIL_USER and GMAIL_APP_PASSWORD in .env to use Gmail as the free transporter.
// Generate an App Password at: https://myaccount.google.com/apppasswords
// (Requires 2-Step Verification to be enabled on the Gmail account.)
const gmailTransporter =
    process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
        ? nodemailer.createTransport({
              host: 'smtp.gmail.com',
              port: 465,
              secure: true,
              auth: {
                  user: process.env.GMAIL_USER,
                  pass: process.env.GMAIL_APP_PASSWORD,
              },
          })
        : null;

// ─── Core send helper ─────────────────────────────────────────────────────────

export const sendEmail = async (to: string | string[], subject: string, html: string) => {
    // 1. Try Resend
    if (resend) {
        const { data, error } = await resend.emails.send({
            from: `NSS <${fromEmail}>`,
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
        });
        if (error) throw error;
        return data;
    }

    // 2. Try Gmail / Nodemailer
    if (gmailTransporter) {
        const info = await gmailTransporter.sendMail({
            from: `"NSS JSPM RSCOE" <${process.env.GMAIL_USER}>`,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject,
            html,
        });
        return { id: info.messageId };
    }

    // 3. Dev mock fallback
    console.log('--- MOCK EMAIL ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('------------------');
    return { id: 'mock-id' };
};

// ─── Meeting reminder email ───────────────────────────────────────────────────

export const sendMeetingNotificationEmail = async (
    volunteerEmail: string | string[],
    title: string,
    date: string,
    location: string,
) => {
    const subject = `New Meeting Scheduled: ${title}`;
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>NSS Meeting Notification</h2>
            <p>You have been scheduled for a new meeting.</p>
            <table style="width: 100%; max-width: 400px; border-collapse: collapse; margin-top: 15px;">
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Title</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${title}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Date/Time</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${new Date(date).toLocaleString()}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Location</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${location}</td></tr>
            </table>
            <p style="margin-top: 20px;">Please check your dashboard for more details.</p>
        </div>
    `;
    return sendEmail(volunteerEmail, subject, html);
};

// ─── Volunteering pass approval email ────────────────────────────────────────

export interface PassEmailData {
    name: string;
    email: string;
    visitorPassId: string;
    eventTitle: string;
    eventDate: string;
    eventLocation: string;
    department: string;
    year: string;
    passDownloadUrl: string;
}

export const sendVolunteeringPassEmail = async (data: PassEmailData) => {
    const subject = `✅ Your Volunteering Pass for "${data.eventTitle}" – ${data.visitorPassId}`;

    const eventDateFormatted = (() => {
        try { return new Date(data.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); }
        catch { return data.eventDate; }
    })();

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#1a365d;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:1px;">NSS – JSPM RSCOE</h1>
            <p style="margin:6px 0 0;color:#a0bfe0;font-size:13px;">National Service Scheme</p>
          </td>
        </tr>

        <!-- Approved Banner -->
        <tr>
          <td style="background:#22c55e;padding:12px 32px;text-align:center;">
            <span style="color:#fff;font-weight:700;font-size:15px;">🎉 Registration Approved!</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#374151;">Dear <strong>${data.name}</strong>,</p>
            <p style="margin:0 0 24px;font-size:14px;color:#4b5563;line-height:1.7;">
              Your registration for volunteering at the upcoming NSS event has been <strong style="color:#16a34a;">approved</strong>.
              Your Volunteering Pass is ready. Please find the details below and present this pass at the venue.
            </p>

            <!-- Pass Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border:2px solid #1a365d;border-radius:10px;margin-bottom:24px;">
              <tr>
                <td style="background:#1a365d;padding:14px 20px;border-radius:8px 8px 0 0;text-align:center;">
                  <span style="color:#fff;font-size:16px;font-weight:700;letter-spacing:2px;">VOLUNTEERING PASS</span>
                </td>
              </tr>
              <tr><td style="padding:20px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;font-size:12px;width:130px;text-transform:uppercase;font-weight:600;">Pass ID</td>
                    <td style="padding:6px 0;color:#1a365d;font-size:18px;font-weight:700;font-family:Courier New,monospace;">${data.visitorPassId}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;font-weight:600;">Volunteer Name</td>
                    <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">${data.name}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;font-weight:600;">Event</td>
                    <td style="padding:6px 0;color:#111827;font-size:14px;">${data.eventTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;font-weight:600;">Date</td>
                    <td style="padding:6px 0;color:#111827;font-size:14px;">${eventDateFormatted}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;font-weight:600;">Venue</td>
                    <td style="padding:6px 0;color:#111827;font-size:14px;">${data.eventLocation}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;font-weight:600;">Department</td>
                    <td style="padding:6px 0;color:#111827;font-size:14px;">${data.department} – ${data.year}</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- Download CTA -->
            <div style="text-align:center;margin-bottom:24px;">
              <a href="${data.passDownloadUrl}" target="_blank"
                 style="display:inline-block;background:#1a365d;color:#fff;padding:13px 32px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;letter-spacing:0.5px;">
                ⬇ Download / View Your Pass
              </a>
              <p style="margin:10px 0 0;font-size:12px;color:#9ca3af;">Or copy this link: ${data.passDownloadUrl}</p>
            </div>

            <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">
              Please carry a digital or printed copy of this pass to the event venue.
              For any queries, contact us at <a href="mailto:nss@jspmrscoe.edu.in" style="color:#1a365d;">nss@jspmrscoe.edu.in</a>.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">NSS – JSPM Rajarshi Shahu College of Engineering, Pune</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    return sendEmail(data.email, subject, html);
};
