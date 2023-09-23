import { Router } from 'express';
import { urlencoded } from 'body-parser';
import { AuthController } from '../controllers/auth.controller';
import cors from 'cors';

export class AuthRoutes {
    public router: Router = Router({mergeParams: true});
    public controller: AuthController = new AuthController();

    constructor() {
        this.init();
    }

    public init() {
        this.router.use(
            urlencoded({
                extended: true,
            }),
        );

        this.router.use(cors());
        this.router.post('/password-recovery-tokens', this.controller.createPasswordRecoveryToken);
        this.router.get('/password-recovery-tokens/:token', this.controller.getUserFromPasswordRecoveryToken);
        this.router.put('/password-recovery-tokens/:token', this.controller.usePasswordRecoveryToken);
    }
}
