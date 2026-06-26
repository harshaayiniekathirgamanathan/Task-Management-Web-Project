jest.mock('nodemailer', () => ({
    createTransport: jest.fn(),
}));

const nodemailer = require('nodemailer');
const emailService = require('../utils/emailService');

describe('emailService', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = {
            ...originalEnv,
            NODE_ENV: 'test',
            SMTP_HOST: 'smtp.gmail.com',
            SMTP_PORT: '465',
            SMTP_USER: 'sender@gmail.com',
            SMTP_PASS: 'abcd efgh ijkl mnop',
            MAIL_FROM: '',
            ALLOW_CONSOLE_ONBOARDING: 'false',
        };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('strips spaces from Gmail app passwords before sending', async () => {
        const sendMail = jest.fn().mockResolvedValue({ messageId: 'message-id' });
        nodemailer.createTransport.mockReturnValue({ sendMail });

        await emailService.sendOnboardingEmail(
            'newuser@gmail.com',
            'New User',
            'Temp-Password1'
        );

        expect(nodemailer.createTransport).toHaveBeenCalledWith(
            expect.objectContaining({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                family: 4,
                auth: {
                    user: 'sender@gmail.com',
                    pass: 'abcdefghijklmnop',
                },
            })
        );
        expect(sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                from: '"Task Management" <sender@gmail.com>',
                to: 'newuser@gmail.com',
            })
        );
    });

    it('throws a clear error when SMTP is missing and console fallback is disabled', async () => {
        delete process.env.SMTP_PASS;

        await expect(
            emailService.sendOnboardingEmail('newuser@gmail.com', 'New User', 'Temp-Password1')
        ).rejects.toMatchObject({
            status: 503,
            message: expect.stringContaining('SMTP configuration is missing'),
        });

        expect(nodemailer.createTransport).not.toHaveBeenCalled();
    });
});
