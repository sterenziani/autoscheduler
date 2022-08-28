import express, { Application } from 'express';
import * as dotenv from 'dotenv';
import { HomeRoutes } from './routes/home.routes';

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
    }

    private initializeErrorHandling() {
        // TODO: create error handling middleware
    }

    private setRoutes() {
        this.app.use('/', new HomeRoutes().router);
    }
}

export default new App().app;
