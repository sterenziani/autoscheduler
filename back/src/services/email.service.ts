import nodemailer from 'nodemailer';

export default class EmailService {
    private static instance: EmailService;
    private transporter: nodemailer.Transporter;

    static getInstance(): EmailService {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }

    constructor() {
        const nodemailer = require("nodemailer");
        this.transporter = nodemailer.createTransport({
            host: "smtp.gmail.com", // SMTP server address (usually mail.your-domain.com)
            port: 465, // Port for SMTP (usually 465)
            secure: true, // Usually true if connecting to port 465
            auth: {
                user: process.env.EMAIL_USER, // Your email address
                pass: process.env.EMAIL_PASS, // Password (for gmail, your app password)
                //  For better security, use environment variables set on the server for these values when deploying
            },
        });
    }

    // public methods
    async sendEmail(destination: string, subject: string, html: string): Promise<void> {
        try {
            let info = await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: destination,
                subject: subject,
                html: html,
            });
        } catch(err) {
            console.log(err);
        }
    }

    // TODO: Translate body and subject
    async sendUniversityWelcomeEmail(destination: string): Promise<void> {
        const body = "<h1>Thank you for joining AutoScheduler!</h1><p>Currently your university is not verified. To make yourself visible to your students, please contact us at "+process.env.EMAIL_VERIFICATION_ADDRESS +" attaching proof that you represent the university.</p>"
        this.sendEmail(destination, "Welcome to AutoScheduler!", body);
    }
}
