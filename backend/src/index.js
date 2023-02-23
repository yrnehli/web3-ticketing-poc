require('dotenv').config()

const ganache = require("ganache");
const restify = require("restify");
const cookies = require('restify-cookies');
const crypto = require('crypto');
const errs = require('restify-errors');
const db = require("./helpers/db.js");
const contract = require("./helpers/contract.js");
const utils = require("./helpers/utils.js");
const validators = require("./helpers/validators.js");
const path = require('path');
const server = restify.createServer();
const sessions = new Map();
const API_BASE = "/api";
const API_ADMIN_PASSWORD = "password";

ganache
	.server({
		database: { dbPath: path.resolve('../eth/blockchain') },
		wallet: { seed: "seed" }
	})
	.listen(8545, err => {
		if (err) {
			throw err;
		}
	})
;

server.listen(3001);
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
server.use(cookies.parse);
server.use((req, res, next) => {
	const sid = req.cookies.sid || crypto.randomBytes(32).toString('base64');

	if (!req.cookies.sid) {
		res.setCookie("sid", sid);
	}
	
	if (!sessions.has(sid)) {
		sessions.set(sid, {});
	}
	
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	req.session = sessions.get(sid);

	return next();
});

server.opts("*", (req, res, next) => {
    res.header("Access-Control-Allow-Methods", req.header("Access-Control-Request-Method"));
    res.header("Access-Control-Allow-Headers", req.header("Access-Control-Request-Headers"));
    res.send(200);
	return next();
});

const response = async (req, res, fn) => {
	try {
		const data = await fn(req);
		res.send(
			200,
			data ? JSON.parse(JSON.stringify(data)) : undefined
		);
	} catch (e) {
		console.error(e);
		res.send(
			(e instanceof errs.HttpError) ? e : new errs.InternalServerError()
		);
	}
};

server.get(API_BASE + "/events/:id?", async (req, res) => {
	await response(req, res, async (req) => {
		const events = await db.getEvents({
			id: req.params.id,
			genres: (req.query?.genres !== "") ? req.query?.genres?.split(",") : null,
			locations: (req.query?.locations !== "") ? req.query?.locations?.split(",") : null,
			maxPrice: req.query?.maxPrice,
			search: req.query?.search
		});

		if (req.params.id) {
			if (!events) {
				throw new errs.ResourceNotFoundError();
			} else {
				return events.shift();
			}
		}

		const limit = 10;
		const offset = Math.max(parseInt(req.query?.offset) || 0, 0);
		const slice = events.slice(offset, offset + limit);

		return {
			events: slice,
			nextOffset: (offset + limit >= events.length) ? false : offset + limit
		};
	});
});

server.get(API_BASE + "/events/:id/metadata", async (req, res) => {
	await response(req, res, async (req) => {
		const events = await db.getEvents({ id: Number(req.params.id) });
		const event = events.shift();

		return {
			title: event.name,
			description: event.description,
			image: event.imagePath,
			properties: {
				artist: event.artist,
				venue: event.venue,
				city: event.city,
				time: event.time,
				quantity: event.quantity
			}
		}
	});
});

server.get(API_BASE + "/genres", async (req, res) => {
	await response(req, res, async (req) => {
		return db.getGenres();
	});
});

server.get(API_BASE + "/locations", async (req, res) => {
	await response(req, res, async (req) => {
		return db.getLocations();
	});
});

server.get(API_BASE + "/purchases/:address", async (req, res) => {
	await response(req, res, async (req) => {
		return utils.getPurchases(req.params.address);
	});
});

server.get(API_BASE + "/contract", async (req, res) => {
	await response(req, res, async (req) => {
		return {
			ABI: contract.ABI,
			address: contract.address
		};
	});
});

server.post(API_BASE + "/login", async (req, res) => {
	await response(req, res, async (req) => {
		if (req.body.password === API_ADMIN_PASSWORD) {
			req.session.admin = true;
		} else {
			throw new errs.UnauthorizedError()
		}
	});
});

server.post(API_BASE + "/events", async (req, res) => {
	await response(req, res, async (req) => {
		if (!req.session.admin) {
			throw new errs.UnauthorizedError();
		}

		if (!validators.createEvent(req.body)) {
			throw new errs.BadRequestError();
		}

		const event = { ...req.body };

		const dbEvent = { ...event, time: new Date(event.time * 1000) };
		delete dbEvent.genres;

		event.id = await db.createEvent(dbEvent);

		await db.setGenresForEvent(event.id, event.genres);
		await contract
			.instance
			.methods
			.createEvent(
				event.id,
				event.name,
				event.time,
				event.price,
				event.quantity
			)
			.send({ from: contract.owner, gas: contract.gas })
		;
		await db.updateEvent(event.id, { deployed: 1 });
	});
});

server.put(API_BASE + "/events", async (req, res) => {
	await response(req, res, async (req) => {
		if (!req.session.admin) {
			throw new errs.UnauthorizedError();
		}

		if (!validators.updateEvent(req.body)) {
			throw new errs.BadRequestError();
		}

		const event = { ...req.body };
		const contractEvent = await contract
			.instance
			.methods
			.events(event.id)
			.call()
		;

		if (!contractEvent.created) {
			throw new errs.BadRequestError();
		}

		await contract
			.instance
			.methods
			.updateEvent(
				event.id,
				event.name,
				event.time,
				event.quantity
			)
			.send({ from: contract.owner, gas: contract.gas })
		;

		await db.setGenresForEvent(event.id, event.genres);

		const dbEvent = { ...event, time: new Date(event.time * 1000) };
		delete dbEvent.genres;

		await db.updateEvent(event.id, dbEvent);
	});
});
