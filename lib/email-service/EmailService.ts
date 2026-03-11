
import nodemailer from 'nodemailer';

export class EmailService {
    private transporter: nodemailer.Transporter | null = null;
    private senderEmail: string | null = null;
    private hasLoggedMissingConfig = false;
    private authRejected = false;
    private hasLoggedAuthError = false;

    constructor() {
        const emailUser = process.env.EMAIL_USER?.trim();
        const emailPassword = (process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASS || '')
            .replace(/\s+/g, '')
            .trim();

        this.senderEmail = emailUser || null;

        if (!emailUser || !emailPassword) {
            return;
        }

        this.transporter = nodemailer.createTransport({
            service: 'gmail', // Or 'smtp.gmail.com'
            auth: {
                user: emailUser,
                pass: emailPassword,
            },
        });
    }

    async sendEmail(to: string, subject: string, html: string) {
        if (!this.transporter || !this.senderEmail) {
            if (!this.hasLoggedMissingConfig) {
                console.warn('Email service is not configured. Set EMAIL_USER and EMAIL_APP_PASSWORD (or EMAIL_PASS).');
                this.hasLoggedMissingConfig = true;
            }

            return {
                success: false,
                error: new Error('Email service credentials are missing.'),
            };
        }

        if (this.authRejected) {
            return {
                success: false,
                error: new Error('SMTP authentication has failed. Check EMAIL_USER and app password.'),
            };
        }

        try {
            const mailOptions = {
                from: `"Charan Organics" <${this.senderEmail}>`,
                to,
                subject,
                html,
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Message sent: %s', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            const authError = error as NodeJS.ErrnoException & {
                responseCode?: number;
                response?: string;
            };
            const isAuthError = authError?.code === 'EAUTH' || authError?.responseCode === 535;

            if (isAuthError) {
                this.authRejected = true;
                if (!this.hasLoggedAuthError) {
                    console.error(
                        'Email authentication failed. Verify EMAIL_USER and Gmail app password (EMAIL_APP_PASSWORD or EMAIL_PASS).'
                    );
                    this.hasLoggedAuthError = true;
                }
            } else {
                console.error('Error sending email:', error);
            }
            return { success: false, error };
        }
    }
}

export const emailService = new EmailService();
