const nodemailer = require('nodemailer');

function hasSmtpConfig() {
    return Boolean(
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
    );
}

function logDevCredentials(to, name, tempPassword) {
    console.log('----------------------------------------');
    console.log('SMTP configuration is missing in .env.');
    console.log('Printing onboarding credentials to console:');
    console.log(`To: ${to}`);
    console.log(`Name: ${name}`);
    console.log(`Temporary Password: ${tempPassword}`);
    console.log('----------------------------------------');
}

const sendOnboardingEmail = async (to, name, tempPassword) => {
    if (!hasSmtpConfig()) {
        if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_CONSOLE_ONBOARDING === 'true') {
            logDevCredentials(to, name, tempPassword);
            return { sent: false, skipped: true };
        }

        const err = new Error('SMTP configuration is missing. Add SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.');
        err.status = 503;
        throw err;
    }

    const smtpPort = parseInt(process.env.SMTP_PORT, 10);
    const smtpUser = process.env.SMTP_USER.trim();
    const smtpPass = process.env.SMTP_PASS.replace(/\s/g, '');

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: smtpPort,
        // STARTTLS on 587, implicit TLS on 465
        secure: smtpPort === 465,
        // Gmail SMTP can hang on some IPv6/network paths; prefer IPv4.
        family: 4,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
        // Fail fast instead of hanging on an unreachable/blocked SMTP host.
        connectionTimeout: 30000, // 30s to establish the TCP connection
        greetingTimeout: 30000,   // 30s to receive the SMTP greeting
        socketTimeout: 30000,     // 30s of socket inactivity
    });

    const mailOptions = {
        from: process.env.MAIL_FROM || `"Task Management" <${smtpUser}>`,
        to,
        subject: 'Welcome to Task Management System - Your Onboarding Credentials',
        text: `Hello ${name},\n\nAn account has been created for you on the Task Management System.\n\nYour login details are:\nEmail: ${to}\nTemporary Password: ${tempPassword}\n\nYou will be required to change your password upon your first login.\n\nBest regards,\nTask Management Team`,
        html: `<p>Hello <strong>${name}</strong>,</p>
           <p>An account has been created for you on the Task Management System.</p>
           <p>Your login details are:</p>
           <ul>
             <li><strong>Email:</strong> ${to}</li>
             <li><strong>Temporary Password:</strong> <code>${tempPassword}</code></li>
           </ul>
           <p>You will be required to change your password upon your first login.</p>
           <br/>
           <p>Best regards,<br/>Task Management Team</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    return { sent: true, messageId: info.messageId };
};

module.exports = {
    sendOnboardingEmail,
    hasSmtpConfig,
};
