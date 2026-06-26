const nodemailer = require('nodemailer');

const sendOnboardingEmail = async (to, name, tempPassword) => {
    const hasSmtpConfig =
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS;

    if (!hasSmtpConfig) {
        console.log('----------------------------------------');
        console.log('SMTP configuration is missing in .env.');
        console.log(`Printing onboarding credentials to console:`);
        console.log(`To: ${to}`);
        console.log(`Name: ${name}`);
        console.log(`Temporary Password: ${tempPassword}`);
        console.log('----------------------------------------');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        // STARTTLS on 587, implicit TLS on 465
        secure: parseInt(process.env.SMTP_PORT, 10) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        // Fail fast instead of hanging on an unreachable/blocked SMTP host.
        connectionTimeout: 10000, // 10s to establish the TCP connection
        greetingTimeout: 10000,   // 10s to receive the SMTP greeting
        socketTimeout: 15000,     // 15s of socket inactivity
    });

    const mailOptions = {
        from: process.env.MAIL_FROM || '"Task Management" <no-reply@example.com>',
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

    await transporter.sendMail(mailOptions);
};

module.exports = {
    sendOnboardingEmail,
};
