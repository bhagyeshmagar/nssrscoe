import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import dns from 'dns';
import * as XLSX from 'xlsx';
import { db } from '../db';
import { emailLogs } from '../db/schema';

// Force IPv4 resolution to prevent ENETUNREACH errors on IPv6-disabled hosts (like Render)
dns.setDefaultResultOrder('ipv4first');

// ─── Resend (if API key is set) ───────────────────────────────────────────────
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

// ─── Nodemailer / Gmail (free) ─────────────────────────────────────────────────
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

interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    attachments?: { filename: string; content: Buffer; contentType: string }[];
}

export const sendEmail = async ({ to, subject, html, attachments }: SendEmailOptions) => {
    const recipients = Array.isArray(to) ? to : [to];

    // 1. Try Resend
    if (resend) {
        const resendAttachments = attachments?.map(a => ({
            filename: a.filename,
            content: a.content,
        }));
        const { data, error } = await resend.emails.send({
            from: `NSS <${fromEmail}>`,
            to: recipients,
            subject,
            html,
            ...(resendAttachments && { attachments: resendAttachments }),
        });
        if (error) throw error;
        return data;
    }

    // 2. Try Gmail / Nodemailer
    if (gmailTransporter) {
        const nodemailerAttachments = attachments?.map(a => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType,
        }));
        const info = await gmailTransporter.sendMail({
            from: `"NSS JSPM RSCOE" <${process.env.GMAIL_USER}>`,
            to: recipients.join(', '),
            subject,
            html,
            ...(nodemailerAttachments && { attachments: nodemailerAttachments }),
        });
        return { id: info.messageId };
    }

    // 3. Dev mock fallback
    console.log('--- MOCK EMAIL ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    if (attachments) console.log(`Attachments: ${attachments.map(a => a.filename).join(', ')}`);
    console.log('------------------');
    return { id: 'mock-id' };
};

// ─── Email Log Helper ─────────────────────────────────────────────────────────

interface LogEmailInput {
    emailType: string;
    subject: string;
    recipientEmail: string;
    recipientName?: string;
    status: 'sent' | 'failed';
    errorMessage?: string;
    metadata?: Record<string, unknown>;
    sentByAdminId?: number;
}

export const logEmail = async (input: LogEmailInput) => {
    try {
        await db.insert(emailLogs).values({
            emailType: input.emailType,
            subject: input.subject,
            recipientEmail: input.recipientEmail,
            recipientName: input.recipientName,
            status: input.status,
            errorMessage: input.errorMessage,
            metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
            sentByAdminId: input.sentByAdminId,
        });
    } catch (e) {
        console.error('[emailLogs] Failed to write log:', e);
    }
};

// ─── NSS Email HTML wrapper & Helpers ──────────────────────────────────────────

export const escapeHtml = (unsafe: string) => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

export const sendAndLog = async (opts: SendEmailOptions & { emailType: string; recipientName?: string; metadata?: object; adminId?: number }) => {
    let status: 'sent' | 'failed' = 'sent';
    let errorMessage: string | undefined;
    try {
        await sendEmail({
            to: opts.to,
            subject: opts.subject,
            html: opts.html,
            attachments: opts.attachments,
        });
    } catch (err: any) {
        status = 'failed';
        errorMessage = err?.message ?? String(err);
        console.error(`[${opts.emailType}] Failed:`, err);
    }
    
    // We assume single recipient string for logging based on existing codebase
    const recipientEmail = Array.isArray(opts.to) ? opts.to.join(', ') : opts.to;
    
    await logEmail({
        emailType: opts.emailType,
        subject: opts.subject,
        recipientEmail,
        recipientName: opts.recipientName,
        status,
        errorMessage,
        metadata: opts.metadata as Record<string, unknown>,
        sentByAdminId: opts.adminId,
    });
    return status;
};

const nssEmailWrapper = (bannerColor: string, bannerText: string, bodyContent: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#1a365d;padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;letter-spacing:1px;">NSS – JSPM RSCOE</h1>
            <p style="margin:4px 0 0;color:#a0bfe0;font-size:12px;">National Service Scheme</p>
          </td>
        </tr>
        <tr>
          <td style="background:${bannerColor};padding:10px 32px;text-align:center;">
            <span style="color:#fff;font-weight:700;font-size:14px;">${bannerText}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            ${bodyContent}
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:14px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">NSS – JSPM Rajarshi Shahu College of Engineering, Pune</p>
            <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">For queries contact: <a href="mailto:nssrscoe073@gmail.com" style="color:#1a365d;">nssrscoe073@gmail.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ─── 1. Volunteer Welcome Email ───────────────────────────────────────────────

export interface WelcomeEmailData {
    name: string;
    email: string;
    password: string;
    department: string;
    loginUrl?: string;
}

export const sendVolunteerWelcomeEmail = async (data: WelcomeEmailData, adminId?: number) => {
    const subject = `🎉 Welcome to NSS – Your Account is Ready!`;
    const loginUrl = data.loginUrl || process.env.CLIENT_URL || 'http://localhost:5173';

    const body = `
        <p style="margin:0 0 16px;font-size:15px;color:#374151;">Dear <strong>${escapeHtml(data.name)}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#4b5563;line-height:1.7;">
            Welcome to the <strong>NSS – JSPM RSCOE</strong> volunteer program! Your account has been created by the NSS admin team.
            Please find your login credentials below.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border:1px solid #bfdbfe;border-radius:8px;margin-bottom:24px;">
          <tr><td style="padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;font-weight:600;width:130px;">Department</td>
                <td style="padding:6px 0;color:#111827;font-size:14px;">${escapeHtml(data.department)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;font-weight:600;">Login Email</td>
                <td style="padding:6px 0;color:#1a365d;font-size:14px;font-weight:700;">${data.email}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;font-weight:600;">Password</td>
                <td style="padding:6px 0;color:#1a365d;font-size:16px;font-weight:700;font-family:Courier New,monospace;letter-spacing:2px;">${data.password}</td>
              </tr>
            </table>
          </td></tr>
        </table>
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${loginUrl}/login" target="_blank"
             style="display:inline-block;background:#1a365d;color:#fff;padding:12px 30px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;">
            Login to Your Account →
          </a>
        </div>
        <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">
            <strong>Please change your password</strong> after your first login for security.<br/>
            We look forward to your active participation in NSS activities!
        </p>`;

    const html = nssEmailWrapper('#22c55e', '🎉 Welcome to NSS!', body);

    await sendAndLog({
        to: data.email,
        subject,
        html,
        emailType: 'volunteer_welcome',
        recipientName: data.name,
        metadata: { department: data.department },
        adminId
    });
};

// ─── 2. Volunteer Backup Notification Email ───────────────────────────────────

export interface BackupEmailData {
    name: string;
    email: string;
    department: string;
}

export const sendVolunteerBackupEmail = async (data: BackupEmailData, adminId?: number) => {
    const subject = `NSS – Update on Your Volunteer Status`;

    const body = `
        <p style="margin:0 0 16px;font-size:15px;color:#374151;">Dear <strong>${escapeHtml(data.name)}</strong>,</p>
        <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
            We hope this message finds you well. We would like to inform you that your current status in the
            <strong>NSS – JSPM RSCOE</strong> volunteer program has been updated to <strong style="color:#d97706;">Backup Volunteer</strong>.
        </p>
        <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
          <p style="margin:0 0 10px;font-size:14px;color:#92400e;font-weight:700;">📌 What does this mean?</p>
          <p style="margin:0 0 10px;font-size:13px;color:#78350f;line-height:1.7;">
              As a backup volunteer, you may be called upon to participate in NSS events and activities whenever needed.
              This is a great opportunity to stay engaged and demonstrate your dedication.
          </p>
          <p style="margin:0;font-size:13px;color:#78350f;line-height:1.7;">
              <strong>We strongly encourage you to:</strong>
              <ul style="margin:8px 0 0 0;padding-left:20px;">
                <li>Be <strong>consistent</strong> with your participation in every NSS event.</li>
                <li>Be <strong>regular</strong> and punctual for all activities you are called for.</li>
                <li>Maintain active communication with your department coordinator.</li>
              </ul>
          </p>
        </div>
        <p style="font-size:14px;color:#4b5563;line-height:1.7;margin:0 0 16px;">
            Your hard work and regular contribution are the best ways to demonstrate your commitment.
            Keep up the spirit of service! 💪
        </p>
        <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">
            For any queries or concerns, please contact your <strong>respective department coordinator</strong> or reach us at
            <a href="mailto:nssrscoe073@gmail.com" style="color:#1a365d;">nssrscoe073@gmail.com</a>.
        </p>`;

    const html = nssEmailWrapper('#d97706', '📋 Status Update: Backup Volunteer', body);

    await sendAndLog({
        to: data.email,
        subject,
        html,
        emailType: 'volunteer_backup',
        recipientName: data.name,
        metadata: { department: data.department },
        adminId
    });
};

// ─── 3. Volunteer Regular Notification Email ───────────────────────────────────

export const sendVolunteerRegularEmail = async (data: BackupEmailData, adminId?: number) => {
    const subject = `NSS – Congratulations on Your Regular Volunteer Status!`;

    const body = `
        <p style="margin:0 0 16px;font-size:15px;color:#374151;">Dear <strong>${escapeHtml(data.name)}</strong>,</p>
        <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
            We are thrilled to inform you that due to your consistent participation and dedication, your status in the
            <strong>NSS – JSPM RSCOE</strong> volunteer program has been updated to <strong style="color:#2563eb;">Regular Volunteer</strong>! 🎉
        </p>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
          <p style="margin:0 0 10px;font-size:14px;color:#1e40af;font-weight:700;">📌 Excellent Work!</p>
          <p style="margin:0 0 10px;font-size:13px;color:#1e3a8a;line-height:1.7;">
              Your hard work and active involvement in NSS events have not gone unnoticed. Being a Regular Volunteer
              means you are an essential part of our core activities.
          </p>
          <p style="margin:0;font-size:13px;color:#1e3a8a;line-height:1.7;">
              <strong>We hope you continue to:</strong>
              <ul style="margin:8px 0 0 0;padding-left:20px;">
                <li>Be <strong>proactive</strong> in upcoming NSS events.</li>
                <li>Maintain your excellent <strong>consistency</strong> and punctuality.</li>
                <li>Inspire your peers and backup volunteers.</li>
              </ul>
          </p>
        </div>
        <p style="font-size:14px;color:#4b5563;line-height:1.7;margin:0 0 16px;">
            Thank you for your valuable contribution to the community and the National Service Scheme. Keep up the great spirit of service! 💪
        </p>
        <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">
            For any queries or concerns, please contact your <strong>respective department coordinator</strong> or reach us at
            <a href="mailto:nssrscoe073@gmail.com" style="color:#1a365d;">nssrscoe073@gmail.com</a>.
        </p>`;

    const html = nssEmailWrapper('#3b82f6', '⭐ Status Update: Regular Volunteer', body);

    await sendAndLog({
        to: data.email,
        subject,
        html,
        emailType: 'volunteer_regular',
        recipientName: data.name,
        metadata: { department: data.department },
        adminId
    });
};

// ─── 3. HOD Attendance Report Email ──────────────────────────────────────────

export interface VolunteerAttendanceRow {
    prnNo: string;
    name: string;
    department: string;
    status: string;
}

export interface HodContact {
    name: string;
    email: string;
    department: string;
}

export interface HodAttendanceReportData {
    ayLabel: string;
    eventTitle: string;
    eventDate: string;
    eventLocation: string;
    sessionId: number;
    eventId: number;
    volunteers: VolunteerAttendanceRow[];
}

export const sendHodAttendanceReport = async (
    data: HodAttendanceReportData,
    hods: HodContact[],
    adminId?: number,
): Promise<{ sent: number; failed: number; results: { hod: string; status: string; error?: string }[] }> => {
    const results: { hod: string; status: string; error?: string }[] = [];
    let sent = 0;
    let failed = 0;

    const promises = hods.map(async (hod) => {
        const deptVolunteers = data.volunteers.filter(v => v.department === hod.department);
        if (deptVolunteers.length === 0) {
            return { hod: hod.email, status: 'skipped (no volunteers in dept)' };
        }

        const wsData = [
            [`NSS Attendance Report — AY ${data.ayLabel}`],
            [`Event: ${data.eventTitle}`],
            [`Date: ${new Date(data.eventDate).toLocaleDateString('en-IN')}`],
            [`Location: ${data.eventLocation}`],
            [`Department: ${hod.department}`],
            [],
            ['Sr. No.', 'PRN No.', 'Name', 'Department', 'Attendance Status'],
            ...deptVolunteers.map((v, i) => [
                i + 1,
                v.prnNo || 'N/A',
                v.name,
                v.department,
                v.status.charAt(0).toUpperCase() + v.status.slice(1),
            ]),
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [{ wch: 8 }, { wch: 15 }, { wch: 30 }, { wch: 35 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

        const xlsxBuffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
        const filename = `NSS_Attendance_${hod.department.replace(/\s+/g, '_')}_${new Date(data.eventDate).toISOString().slice(0, 10)}.xlsx`;
        const subject = `NSS Attendance Report – ${data.eventTitle} (${hod.department})`;
        const presentCount = deptVolunteers.filter(v => v.status === 'present').length;
        const absentCount = deptVolunteers.filter(v => v.status === 'absent').length;

        const body = `
            <p style="margin:0 0 16px;font-size:15px;color:#374151;">Dear <strong>Prof. ${escapeHtml(hod.name)}</strong>,</p>
            <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
                Please find attached the NSS volunteer attendance report for your department
                (<strong>${escapeHtml(hod.department)}</strong>) for the event listed below.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border:1px solid #bfdbfe;border-radius:8px;margin-bottom:20px;">
              <tr><td style="padding:16px 20px;">
                <table width="100%">
                  <tr><td style="padding:4px 0;color:#6b7280;font-size:12px;font-weight:600;width:120px;">Event</td><td style="color:#111827;font-size:14px;">${escapeHtml(data.eventTitle)}</td></tr>
                  <tr><td style="padding:4px 0;color:#6b7280;font-size:12px;font-weight:600;">Date</td><td style="color:#111827;font-size:14px;">${new Date(data.eventDate).toLocaleDateString('en-IN')}</td></tr>
                  <tr><td style="padding:4px 0;color:#6b7280;font-size:12px;font-weight:600;">Location</td><td style="color:#111827;font-size:14px;">${escapeHtml(data.eventLocation)}</td></tr>
                  <tr><td style="padding:4px 0;color:#6b7280;font-size:12px;font-weight:600;">Department</td><td style="color:#111827;font-size:14px;font-weight:700;">${escapeHtml(hod.department)}</td></tr>
                  <tr><td style="padding:4px 0;color:#6b7280;font-size:12px;font-weight:600;">Summary</td><td style="color:#111827;font-size:14px;">✅ ${presentCount} Present &nbsp;|&nbsp; ❌ ${absentCount} Absent</td></tr>
                </table>
              </td></tr>
            </table>
            <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">
                The complete attendance sheet is attached as an Excel file for your records.
            </p>`;

        const html = nssEmailWrapper('#2563eb', '📊 NSS Attendance Report', body);

        const emailStatus = await sendAndLog({
            to: hod.email,
            subject,
            html,
            attachments: [{ filename, content: xlsxBuffer, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }],
            emailType: 'hod_attendance',
            recipientName: hod.name,
            metadata: { ayLabel: data.ayLabel, eventId: data.eventId, sessionId: data.sessionId, eventTitle: data.eventTitle, department: hod.department },
            adminId
        });

        return {
            hod: hod.email,
            status: emailStatus,
            error: emailStatus === 'failed' ? 'Email failed to send' : undefined
        };
    });

    const settledResults = await Promise.all(promises);

    for (const r of settledResults) {
        if (r.status === 'sent') {
            sent++;
        } else if (r.status === 'failed') {
            failed++;
        }
        results.push(r);
    }

    return { sent, failed, results };
};

// ─── 4. Meeting reminder email ────────────────────────────────────────────────

export const sendMeetingNotificationEmail = async (
    volunteerEmail: string | string[],
    title: string,
    date: string,
    location: string,
    adminId?: number,
) => {
    const subject = `New Meeting Scheduled: ${title}`;

    const formattedDate = new Date(date).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    const body = `
        <p style="margin:0 0 16px;font-size:15px;color:#374151;">You have been scheduled for a new meeting.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border:1px solid #bfdbfe;border-radius:8px;margin-bottom:20px;">
          <tr><td style="padding:16px 20px;">
            <table width="100%">
              <tr><td style="padding:4px 0;color:#6b7280;font-size:12px;font-weight:600;width:120px;">Title</td><td style="color:#111827;font-size:14px;font-weight:700;">${escapeHtml(title)}</td></tr>
              <tr><td style="padding:4px 0;color:#6b7280;font-size:12px;font-weight:600;">Date/Time</td><td style="color:#111827;font-size:14px;">${formattedDate} IST</td></tr>
              <tr><td style="padding:4px 0;color:#6b7280;font-size:12px;font-weight:600;">Location</td><td style="color:#111827;font-size:14px;">${escapeHtml(location)}</td></tr>
            </table>
          </td></tr>
        </table>
        <p style="font-size:13px;color:#6b7280;">Please check your dashboard for more details.</p>`;

    const html = nssEmailWrapper('#7c3aed', '📅 New Meeting Scheduled', body);

    await sendAndLog({
        to: volunteerEmail,
        subject,
        html,
        emailType: 'meeting_notification',
        metadata: { title, date, location, recipientCount: Array.isArray(volunteerEmail) ? volunteerEmail.length : 1 },
        adminId
    });
};

// ─── 5. Volunteering pass approval email ─────────────────────────────────────

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

export const sendVolunteeringPassEmail = async (data: PassEmailData, adminId?: number) => {
    const subject = `✅ Your Volunteering Pass for "${data.eventTitle}" – ${data.visitorPassId}`;

    const eventDateFormatted = (() => {
        try { return new Date(data.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); }
        catch { return data.eventDate; }
    })();

    const body = `
        <p style="margin:0 0 16px;font-size:15px;color:#374151;">Dear <strong>${escapeHtml(data.name)}</strong>,</p>
        <p style="margin:0 0 24px;font-size:14px;color:#4b5563;line-height:1.7;">
          Your registration for volunteering at the upcoming NSS event has been <strong style="color:#16a34a;">approved</strong>.
          Your Volunteering Pass is ready. Please find the details below and present this pass at the venue.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border:2px solid #1a365d;border-radius:10px;margin-bottom:24px;">
          <tr>
            <td style="background:#1a365d;padding:14px 20px;border-radius:8px 8px 0 0;text-align:center;">
              <span style="color:#fff;font-size:16px;font-weight:700;letter-spacing:2px;">VOLUNTEERING PASS</span>
            </td>
          </tr>
          <tr><td style="padding:20px 24px;">
            <table width="100%">
              <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;width:130px;text-transform:uppercase;font-weight:600;">Pass ID</td><td style="padding:6px 0;color:#1a365d;font-size:18px;font-weight:700;font-family:Courier New,monospace;">${data.visitorPassId}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;font-weight:600;">Volunteer Name</td><td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">${escapeHtml(data.name)}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;font-weight:600;">Event</td><td style="padding:6px 0;color:#111827;font-size:14px;">${escapeHtml(data.eventTitle)}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;font-weight:600;">Date</td><td style="padding:6px 0;color:#111827;font-size:14px;">${eventDateFormatted}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;font-weight:600;">Venue</td><td style="padding:6px 0;color:#111827;font-size:14px;">${escapeHtml(data.eventLocation)}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;font-weight:600;">Department</td><td style="padding:6px 0;color:#111827;font-size:14px;">${escapeHtml(data.department)} – ${escapeHtml(data.year)}</td></tr>
            </table>
          </td></tr>
        </table>
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${data.passDownloadUrl}" target="_blank"
             style="display:inline-block;background:#1a365d;color:#fff;padding:13px 32px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;letter-spacing:0.5px;">
            ⬇ Download / View Your Pass
          </a>
          <p style="margin:10px 0 0;font-size:12px;color:#9ca3af;">Or copy this link: ${data.passDownloadUrl}</p>
        </div>
        <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">
          Please carry a digital or printed copy of this pass to the event venue.
        </p>`;

    const html = nssEmailWrapper('#22c55e', '🎉 Registration Approved!', body);

    await sendAndLog({
        to: data.email,
        subject,
        html,
        emailType: 'pass_approval',
        recipientName: data.name,
        metadata: { visitorPassId: data.visitorPassId, eventTitle: data.eventTitle },
        adminId
    });
};
