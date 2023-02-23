const knex = require('knex')({
	client: process.env.DB_CLIENT,
	connection: {
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME
	}
});

const getEvents = async (options) => {
	const events = {};
	const rows = await knex
		.select("events.*")
		.select("genres.name AS genre")
		.table("events")
		.leftJoin("event-genre", "events.id", "event-genre.eventId")
		.leftJoin("genres", "event-genre.genreId", "genres.id")
		.modify(query => {
			if (options?.id) {
				if (Array.isArray(options.id)) {
					query.whereIn("events.id", options.id);
				} else {
					query.where("events.id", options.id);
				}
				
				return;
			}

			if (options?.search) {
				const search = "%" + options.search + "%";

				query
					.whereILike("genres.name", search)
					.orWhereILike("events.city", search)
					.orWhereILike("events.artist", search)
				;
			}
			
			if (options?.genres && options.genres.length) {
				query.whereIn("genres.name", options.genres);
			}

			if (options?.locations && options.locations.length) {
				query.whereIn("events.city", options.locations);
			}

			if (options?.maxPrice) {
				query.where("events.price", "<=", options.maxPrice);
			}
		})
	;

	// Group genres into array for each event
	for (const row of rows) {
		if (!events[row.id]) {
			events[row.id] = {
				...row,
				genres: row.genre ? [row.genre] : []
			};

			delete events[row.id].genre;
		} else {
			events[row.id].genres.push(row.genre);
		}
	}

	return Object.values(events);
};

const getGenres = async () => {
	const genres = await knex
		.select("name")
		.table("genres")
		.pluck("name")
	;

	return genres;
};

const getLocations = async () => {
	const locations = await knex
		.distinct("city")
		.table("events")
		.pluck("city")
	;

	return locations;
};

const createEvent = async (event) => {
	const id = await knex('events').insert(event);
	return id;
};

const addGenresForEvent = async (eventId, eventGenres) => {
	for (const name of eventGenres) {
		await knex("genres")
			.insert({ name: name })
			.onConflict("name")
			.ignore()
		;
	}

	const genresByName = new Map();
	const genres = await knex
		.select("id")
		.select("name")
		.table("genres")
	;

	for (const genre of genres) {
		genresByName.set(genre.name, genre);
	}

	for (const name of eventGenres) {
		await knex("event-genre")
			.insert({
				eventId: eventId,
				genreId: genresByName.get(name).id
			})
			.onConflict(["eventId", "genreId"])
			.ignore()
		;
	}
};


module.exports = {
	getEvents,
	getGenres,
	getLocations,
	createEvent,
	addGenresForEvent
};
