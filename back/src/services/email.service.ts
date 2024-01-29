import { TRANSLATIONS } from '../constants/email.constants';
import Student from '../models/abstract/student.model';
import University from '../models/abstract/university.model';
import User from '../models/abstract/user.model';
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
            service: 'gmail',
            auth: {
                user: process.env.COMPANY_EMAIL, // Your email address
                pass: process.env.COMPANY_EMAIL_PASS, // Password (for gmail, your app password)
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
                from: process.env.COMPANY_EMAIL,
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
            from: process.env.COMPANY_EMAIL,
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

    async sendStudentWelcomeEmail(userEmail: string, userLocale: string, student: Student): Promise<void> {
        const template = "welcomeStudent";
        const emailLanguage = this.getAvailableLocale(userLocale);
        const subject = TRANSLATIONS.resources[emailLanguage].translation.welcome;

        const context = {
            studentName: student.name,
            locale: emailLanguage
        };
        await this.sendEmailTemplate(userEmail, subject, template, context);
    }

    async sendUniversityWelcomeEmail(userEmail: string, userLocale: string, university: University): Promise<void> {
        const template = "welcome";
        const emailLanguage = this.getAvailableLocale(userLocale);
        const subject = TRANSLATIONS.resources[emailLanguage].translation.welcome;

        const context = {
            verificationEmail: process.env.COMPANY_EMAIL,
            universityName: university.name,
            locale: emailLanguage
        };
        await this.sendEmailTemplate(userEmail, subject, template, context);
    }

    async sendUniversityVerifiedEmail(user: User, university: University): Promise<void> {
        const template = "verified";
        const emailLanguage = this.getAvailableLocale(user.locale);
        const subject = TRANSLATIONS.resources[emailLanguage].translation.youAreVerified;

        const context = {
            universityName: university.name,
            locale: emailLanguage
        };
        await this.sendEmailTemplate(user.email, subject, template, context);
    }

    async sendPasswordResetEmail(user: User, internalResetPath: string): Promise<void> {
        const template = "resetPassword";
        const emailLanguage = this.getAvailableLocale(user.locale);
        const subject = TRANSLATIONS.resources[emailLanguage].translation.resetYourPasswordSubject;

        const context = { link: process.env.FRONT_URL+"/"+internalResetPath, locale: emailLanguage };
        await this.sendEmailTemplate(user.email, subject, template, context);
    }

    private getAvailableLocale(locale?: string): string {
        return (locale && TRANSLATIONS.resources[locale]) ? locale : TRANSLATIONS.lng as string;
    }
}
