const mongoose = require("mongoose");
const util = require("util");
// config should be imported before importing any other file
const config = require("./src/config/config");
const app = require("./src/app");

const debug = require("debug")("express-mongoose-es6-rest-api:index");

// make bluebird default Promise
Promise = require("bluebird"); // eslint-disable-line no-global-assign

// plugin bluebird promise in mongoose
mongoose.Promise = Promise;

// connect to mongo db
const db = "share-holding";
const mongoUri = config.mongo.host.replace("db_name", db);
mongoose.connect(mongoUri, {
	maxPoolSize: 1, // Maintain up to 10 socket connections
	serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
	socketTimeoutMS: 30000, // Close sockets after 45 seconds of inactivity
	ssl: true,
	useUnifiedTopology: true,
	useNewUrlParser: true,
	connectTimeoutMS: 1000,
});

mongoose.connection.on("error", (error) => {
	throw new Error(`unable to connect to database: ${mongoUri}`);
});

mongoose.connection.on("open", () => {
	console.log(`connected to database: ${db}`);
});

// module.parent check is required to support mocha watch
// src: https://github.com/mochajs/mocha/issues/1912
// listen on port config.port
const PORT = process.env.NODE_ENV === "production" ? 8000 : 4000;
mongoose.connect(mongoUri, {
	server: {
		ssl: true,
		poolSize: 1,
		socketOptions: {
			keepAlive: 300000,
			connectTimeoutMS: 30000,
		},
		auto_reconnect: true,
		reconnectTries: 300000,
		reconnectInterval: 5000,
	},
	useUnifiedTopology: true,
});
mongoose.connection.on("error", (error) => {
	throw new Error(`unable to connect to database: ${mongoUri}`);
});

// print mongoose logs in dev env
if (config.mongooseDebug) {
	mongoose.set("debug", (collectionName, method, query, doc) => {
		//debug(`${collectionName}.${method}`, util.inspect(query, false, 20), doc);
	});
}

app
	.listen(PORT, (data) => {
		console.info(`server started on port ${PORT} (${config.env})`); // eslint-disable-line no-console
	})
	.on("error", (err) => {
		console.log("Error occured on server =>", err);
	});

process.once("SIGUSR2", function () {
	process.kill(process.pid, "SIGUSR2");
});

process.on("SIGINT", function () {
	// this is only called on ctrl+c, not restart
	process.kill(process.pid, "SIGINT");
});

module.exports = app;
