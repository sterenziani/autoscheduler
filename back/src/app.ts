import express, {Application} from 'express';
import * as dotenv from "dotenv";

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
		// TODO: create routes
	}
}

export default new App().app;