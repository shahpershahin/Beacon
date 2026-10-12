const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
    // Check if SMTP is configured
    const isSmtpConfigured = process.env.SMTP_HOST && 
                             process.env.SMTP_PORT && 
                             process.env.SMTP_USER && 
                             process.env.SMTP_PASS;

    if (!isSmtpConfigured) {
        console.log('\n' + '='.repeat(60));
        console.log(`✉️  [LOCAL DEV EMAIL FALLBACK]`);
        console.log(`To:      ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Content:\n${text}`);
        console.log('='.repeat(60) + '\n');
        return { success: true, localFallback: true };
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT, 10) || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || `"Beacon Security" <no-reply@trybeacon.com>`,
            to,
            subject,
            text,
            html,
        });

        console.log(`✉️  Email sent to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (err) {
        console.error('❌ Error sending email, falling back to console log:', err.message);
        console.log('\n' + '='.repeat(60));
        console.log(`✉️  [LOCAL DEV EMAIL FALLBACK (SMTP FAILED)]`);
        console.log(`To:      ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Content:\n${text}`);
        console.log('='.repeat(60) + '\n');
        return { success: true, localFallback: true, error: err.message };
    }
};

const sendVerificationEmail = async (email, token, frontendUrl = 'http://localhost:3000') => {
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
    const subject = 'Verify your Beacon Account';
    const text = `Welcome to Beacon!\n\nPlease verify your account by clicking the following link:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #4f46e5;">Welcome to Beacon!</h2>
            <p>Please verify your email address to activate your account and start managing your startup dashboard.</p>
            <div style="margin: 30px 0; text-align: center;">
                <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
            </div>
            <p style="font-size: 0.8rem; color: #666;">If you did not sign up for Beacon, you can safely ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 0.8rem; color: #999;">Or copy and paste this URL into your browser:<br/>${verificationUrl}</p>
        </div>
    `;
    return sendEmail({ to: email, subject, text, html });
};

const sendPasswordResetEmail = async (email, token, frontendUrl = 'http://localhost:3000') => {
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const subject = 'Reset your Beacon Password';
    const text = `You are receiving this email because you (or someone else) requested a password reset for your Beacon account.\n\nPlease click the following link to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email. This link will expire in 1 hour.`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #4f46e5;">Reset Your Password</h2>
            <p>We received a request to reset your Beacon password. Click the button below to choose a new password.</p>
            <div style="margin: 30px 0; text-align: center;">
                <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="font-size: 0.8rem; color: #666;">This link is valid for 1 hour. If you did not request this, you can safely ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 0.8rem; color: #999;">Or copy and paste this URL into your browser:<br/>${resetUrl}</p>
        </div>
    `;
    return sendEmail({ to: email, subject, text, html });
};

module.exports = {
    sendEmail,
    sendVerificationEmail,
    sendPasswordResetEmail
};
