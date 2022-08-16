import {Router, urlencoded} from "express";
import {HomeController} from "../controllers/home.controller";
import cors from 'cors';

export class HomeRoutes {
	public router: Router = Router();
	public controller: HomeController = new HomeController();

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

		this.router.get('/', this.controller.healthCheck);
		this.router.post('/', this.controller.login);
	}
}