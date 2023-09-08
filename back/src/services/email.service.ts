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
        const path = require("path");
        const hbs = require("nodemailer-express-handlebars");
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
        const handlebarOptions = {
            viewEngine: {
                extName: ".handlebars",
                partialsDir: path.resolve('./resources/emailTemplates'),
                defaultLayout: false,
            },
            viewPath: path.resolve('./resources/emailTemplates'),
            extName: ".handlebars",
        }
        this.transporter.use('compile', hbs(handlebarOptions));
    }

    // public methods
    async sendEmail(destination: string, subject: string, html: string): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: destination,
                subject: subject,
                html: html,
            });
        } catch(err) {
            console.log(err);
        }
    }

    async sendEmailTemplate(destination: string, subject: string, template: string, context: any): Promise<void> {
        var mailOptions = {
            from: process.env.EMAIL_USER,
            to: destination,
            subject: subject,
            template: template,
            context: context
        }
        try {
            await this.transporter.sendMail(mailOptions);
        } catch(err) {
            console.log(err);
        }
    }

    // TODO: Translate bodies and subjects
    async sendUniversityWelcomeEmail(destination: string, universityName: string): Promise<void> {
        const template = "welcome";
        const context = { verificationEmail: process.env.EMAIL_VERIFICATION_ADDRESS, universityName: universityName };
        this.sendEmailTemplate(destination, "Welcome to AutoScheduler!", template, context);
    }

    async sendPasswordResetEmail(destination: string, resetLink: string): Promise<void> {
        const template = "resetPassword";
        const context = { link: resetLink};
        this.sendEmailTemplate(destination, "Reset your AutoScheduler Password", template, context);
    }
}
