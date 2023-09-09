import { TRANSLATIONS } from '../constants/email.constants';
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

        const i18next = require("i18next");
        i18next.init(TRANSLATIONS);
        const HandlebarsI18n = require("handlebars-i18n");
        HandlebarsI18n.init();

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

    async sendUniversityWelcomeEmail(destination: string, universityName: string, locale: string|undefined): Promise<void> {
        const template = "welcome";
        const emailLanguage = this.getAvailableLocale(locale);
        const subject = TRANSLATIONS.resources[emailLanguage].translation.welcome;

        const context = {
            verificationEmail: process.env.EMAIL_VERIFICATION_ADDRESS,
            universityName: universityName,
            locale: emailLanguage
        };
        this.sendEmailTemplate(destination, subject, template, context);
    }

    async sendPasswordResetEmail(destination: string, internalResetPath: string, locale: string|undefined): Promise<void> {
        const template = "resetPassword";
        const emailLanguage = this.getAvailableLocale(locale);
        const subject = TRANSLATIONS.resources[emailLanguage].translation.resetYourPasswordSubject;

        const context = { link: process.env.BASE_URL+"/"+internalResetPath, locale: emailLanguage };
        this.sendEmailTemplate(destination, subject, template, context);
    }

    private getAvailableLocale(locale: string|undefined){
        return (locale && TRANSLATIONS.resources[locale])? locale:TRANSLATIONS.lng
    }
}
