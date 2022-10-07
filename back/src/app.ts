import express, { Application } from 'express';
import * as dotenv from 'dotenv';
import { HomeRoutes } from './routes/home.routes';
import { StudentRoutes } from './routes/student.routes';
import ErrorHandlerMiddleware from './middlewares/errorHandler.middleware';
import cors from 'cors';

class App {
    public app: Application;

    constructor() {
        this.app = express();

        this.setConfig();
        this.setRoutes();
        this.initializeErrorHandling();
    }

    private setConfig() {
        dotenv.config();
        this.app.use(express.json({ limit: '25mb' }));
        this.app.use(express.urlencoded({ limit: '25mb', extended: true }));
        this.app.use(cors({exposedHeaders: '*'}));
    }

    private initializeErrorHandling() {
        this.app.use(ErrorHandlerMiddleware);
    }

    private setRoutes() {
        this.app.use('/', new HomeRoutes().router);
        this.app.use('/student', new StudentRoutes().router);
    }
}

export default new App().app;
