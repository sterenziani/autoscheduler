import express, { Application } from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import UserAuthMiddleware from './middlewares/userAuth.middleware';
import ErrorHandlerMiddleware from './middlewares/errorHandler.middleware';
import { HomeRoutes } from './routes/home.routes';
import { BuildingRoutes } from './routes/building.routes';
import { CourseRoutes } from './routes/course.routes';
import { CourseClassRoutes } from './routes/courseClass.routes';
import { ProgramRoutes } from './routes/universityPrograms.routes';
import { StudentRoutes } from './routes/students.routes';
import { TermRoutes } from './routes/term.routes';
import { UniversityRoutes } from './routes/university.routes';
import { UniversitiesRoutes } from './routes/universities.routes';
import { UsersRoutes } from './routes/users.routes';
import UserAuthService from './services/auth.service';
import BuildingService from './services/building.service';
import CourseService from './services/course.service';
import CourseClassService from './services/courseClass.service';
import ProgramService from './services/program.service';
import ScheduleService from './services/schedule.service';
import StudentService from './services/student.service';
import TermService from './services/term.service';
import UniversityService from './services/university.service';
import UserService from './services/user.service';
import { initializeMongoConnection } from './helpers/persistence/mongoPersistence.helper';
import { initializeGraphConnection } from './helpers/persistence/graphPersistence.helper';
import UserDaoFactory from './factories/userDao.factory';
import BuildingDaoFactory from './factories/buildingDao.factory';
import ProgramDaoFactory from './factories/programDao.factory';
import { LectureRoutes } from './routes/lecture.routes';
import { UserRoutes } from './routes/user.routes';
import { AuthRoutes } from './routes/auth.routes';

class App {
    public app: Application;

    constructor() {
        this.app = express();

        this.setConfig();
        this.initializeDatabases();
        this.initializeServices();
        this.initializeAuth();
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
            .catch((err) => console.log(JSON.stringify(err)));
        // Neo4j connection
        initializeGraphConnection()
            .then(() => console.log(`[Initialization] Connected to Graph Database`))
            .catch((err) => console.log(JSON.stringify(err)));
    }

    // avoids cyclic dependencies on constructor methods
    private initializeServices() {
        UserAuthService.getInstance().init();
        BuildingService.getInstance().init();
        CourseService.getInstance().init();
        CourseClassService.getInstance().init();
        ProgramService.getInstance().init();
        ScheduleService.getInstance().init();
        StudentService.getInstance().init();
        TermService.getInstance().init();
        UniversityService.getInstance().init();
        UserService.getInstance().init();
    }

    private initializeAuth() {
        this.app.use(UserAuthMiddleware);
    }

    private initializeErrorHandling() {
        this.app.use(ErrorHandlerMiddleware);
    }

    private setRoutes() {
        this.app.use('/api', new HomeRoutes().router);
        this.app.use('/api/auth/', new AuthRoutes().router);
        this.app.use('/api/user/', new UserRoutes().router);
        this.app.use('/api/users/', new UsersRoutes().router);
        this.app.use('/api/university/', new UniversityRoutes().router);
        this.app.use('/api/universities/', new UniversitiesRoutes().router);
        this.app.use('/api/student/', new StudentRoutes().router);
        this.app.use('/api/students/', new StudentsRoutes().router);
    }

    private initializeDaos() {
        UserDaoFactory.get().init();
        BuildingDaoFactory.get().init();
        CourseClassDaoFactory.get().init();
        ProgramDaoFactory.get().init();
    }
}

export default new App().app;
