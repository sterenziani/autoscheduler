import express, { Application } from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import ErrorHandlerMiddleware from './middlewares/errorHandler.middleware';
import { HomeRoutes } from './routes/home.routes';
import { CourseRoutes } from './routes/course.routes';
import { ProgramRoutes } from './routes/program.routes';
import { StudentRoutes } from './routes/student.routes';
import { UniversityRoutes } from './routes/university.routes';
import UserAuthService from './services/auth.service';
import CourseService from './services/course.service';
import ProgramService from './services/program.service';
import StudentService from './services/student.service';
import UniversityService from './services/university.service';
import UserService from './services/user.service';
import {initializeMongoConnection} from "./helpers/persistence/mongoPersistence.helper";
import {initializeGraphConnection} from "./helpers/persistence/graphPersistence.helper";

class App {
    public app: Application;

    constructor() {
        this.app = express();

        this.setConfig();
        this.initializeDatabases();
        this.initializeServices();
        this.setRoutes();
        this.initializeErrorHandling();
    }

    private setConfig() {
        dotenv.config();
        this.app.use(express.json({ limit: '25mb' }));
        this.app.use(express.urlencoded({ limit: '25mb', extended: true }));
        this.app.use(cors({ exposedHeaders: '*' }));
    }

    private initializeDatabases() {
        if (process.env.PERSISTENCE === 'MEMORY') return;
        // Mongo connection
        initializeMongoConnection()
            .then(() => console.log(`[Initialization] Connected to MongoDB`))
            .catch(err => console.log(JSON.stringify(err)));
        // Neo4j connection
        initializeGraphConnection()
            .then(() => console.log(`[Initialization] Connected to Graph Database`))
            .catch(err => console.log(JSON.stringify(err)));
    }

    // avoids cyclic dependencies on constructor methods
    private initializeServices() {
        UserAuthService.getInstance().init();
        CourseService.getInstance().init();
        ProgramService.getInstance().init();
        StudentService.getInstance().init();
        UniversityService.getInstance().init();
        UserService.getInstance().init();
    }

    private initializeErrorHandling() {
        this.app.use(ErrorHandlerMiddleware);
    }

    private setRoutes() {
        this.app.use('/api/', new HomeRoutes().router);
        this.app.use('/api/course', new CourseRoutes().router);
        this.app.use('/api/program', new ProgramRoutes().router);
        this.app.use('/api/student', new StudentRoutes().router);
        this.app.use('/api/university', new UniversityRoutes().router);
    }
}

export default new App().app;
