import { DEFAULT_AUTH_TOKEN_EXPIRE_TIME } from '../constants/auth.constants';
import { IUserInfo } from '../interfaces/auth.interface';
import { ERRORS } from '../constants/error.constants';
import GenericException from '../exceptions/generic.exception';
import { clearMappedStudentProgram, getMappedStudentProgram, jwtSign, jwtVerify, validatePassword } from '../helpers/auth.helper';
import httpException from '../exceptions/http.exception';
import UserService from './user.service';
import User from '../models/abstract/user.model';
import PasswordRecoveryTokenDao from '../persistence/abstract/passwordRecoveryToken.dao';
import PasswordRecoveryTokenDaoFactory from '../factories/passwordRecoveryTokenDao.factory';
import EmailService from './email.service';
import StudentService from './student.service';
import { ROLE } from '../constants/general.constants';

export default class UserAuthService {
    private static instance: UserAuthService;
    private userService!: UserService;
    private studentService!: StudentService;
    private emailService!: EmailService;
    private passwordRecoveryTokenDao: PasswordRecoveryTokenDao;
    private readonly jwtKey: string;
    private readonly jwtPublicKey: string;
    private readonly expireTime: string;

    static getInstance(): UserAuthService {
        if (!UserAuthService.instance) {
            UserAuthService.instance = new UserAuthService();
        }
        return UserAuthService.instance;
    }

    private constructor() {
        this.passwordRecoveryTokenDao = PasswordRecoveryTokenDaoFactory.get();
        this.jwtKey = process.env.AUTH_TOKEN_KEY!;
        this.jwtPublicKey = process.env.AUTH_TOKEN_PUB_KEY!;
        this.expireTime = DEFAULT_AUTH_TOKEN_EXPIRE_TIME;
    }

    init() {
        this.userService = UserService.getInstance();
        this.studentService = StudentService.getInstance();
        this.emailService = EmailService.getInstance();
    }

    // PUBLIC METHODS

    async login(email: string, password: string): Promise<string> {
        // existence check
        let user: User | null = null;
        try {
            user = await this.userService.getUserByEmail(email);
        } catch (e) {
            if (e instanceof httpException && e.code === ERRORS.NOT_FOUND.USER.code) {
                throw new GenericException(ERRORS.BAD_REQUEST.INVALID_LOGIN);
            } else {
                throw e;
            }
        }
        if (!user) throw new GenericException(ERRORS.BAD_REQUEST.INVALID_LOGIN);

        // password check
        if (!validatePassword(password, user.password)) throw new GenericException(ERRORS.BAD_REQUEST.INVALID_LOGIN);

        // generate token
        return await this.generateLoginInfo(user);
    }

    verifyToken(token: string): IUserInfo {
        const userInfo = jwtVerify(this.jwtPublicKey, token);
        if (userInfo.role === ROLE.STUDENT) {
            const maybeMappedProgramId = getMappedStudentProgram(userInfo.id);
            if (maybeMappedProgramId !== undefined) userInfo.programId = maybeMappedProgramId;
        }
        return userInfo;
    }

    async createPasswordRecoveryToken(email: string): Promise<void> {
        const user = await this.userService.getUserByEmail(email);

        var expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 2); // Valid for 2 days

        const token = await this.passwordRecoveryTokenDao.create(user.id, expirationDate);

        // TODO: Define base URL
        const path = "reset/"+token.id;
        await this.emailService.sendPasswordResetEmail(user, path);
    }

    async getUserFromPasswordRecoveryToken(token: string): Promise<User> {
        const recoveryToken = await this.passwordRecoveryTokenDao.getById(token);
        return await recoveryToken.getUser();
    }

    async usePasswordRecoveryToken(token: string, newPassword: string): Promise<string> {
        const user = await this.getUserFromPasswordRecoveryToken(token);
        const updatedUser = await this.userService.modifyUser(user.id, newPassword);
        this.passwordRecoveryTokenDao.delete(token).catch((_) => {});
        return await this.generateLoginInfo(updatedUser);
    }

    private async generateLoginInfo(user: User): Promise<string> {
        // generate token
        const userInfo: IUserInfo = {
            id: user.id,
            email: user.email,
            role: user.role,
            locale: user.locale
        };
        if (user.role == ROLE.STUDENT) {
            const studentInfo = await this.studentService.getStudentInfo(user.id);
            userInfo.universityId = studentInfo.universityId;
            userInfo.studentId = user.id;
            userInfo.programId = studentInfo.programId;
            clearMappedStudentProgram(user.id);
        } else if (user.role == ROLE.UNIVERSITY) {
            userInfo.universityId = user.id;
        }
        return jwtSign(this.jwtKey, this.expireTime, userInfo);
    }
}
