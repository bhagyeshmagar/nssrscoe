import { Resend } from 'resend';

// Initialize Resend
// In development or if RESEND_API_KEY is not set, we can mock it
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// The "from" email address (needs to be verified in Resend, or use "onboarding@resend.dev" for testing)
const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

export const sendEmail = async (to: string | string[], subject: string, html: string) => {
    if (!resend) {
        console.log('--- MOCK EMAIL ---');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${html}`);
        console.log('------------------');
        return { id: 'mock-id' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: `NSS <${fromEmail}>`,
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
        });

        if (error) {
            console.error('Error sending email via Resend:', error);
            throw error;
        }

        return data;
    } catch (err) {
        console.error('Failed to send email:', err);
        throw err;
    }
};

export const sendMeetingNotificationEmail = async (volunteerEmail: string | string[], title: string, date: string, location: string) => {
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

