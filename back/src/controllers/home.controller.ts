import {RequestHandler} from "express";

export class HomeController {

	constructor() {
	}

	public healthCheck: RequestHandler = async (req, res, next) => {
		res.status(204).send();
	}

	public login: RequestHandler = async (req, res, next) => {
		// TODO
		res.status(500).send();
	}
}