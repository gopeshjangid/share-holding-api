const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const compress = require('compression');
const methodOverride = require('method-override');
const cors = require('cors');
const httpStatus = require('http-status');
const expressWinston = require('express-winston');
const expressValidation = require('express-validation');
const helmet = require('helmet');
const routes = require('./routes');
const config = require('./config/config');
const APIError = require('./helpers/APIError');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(express.static('./public'));
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
    }
});
app.set('socketIo', io);
//SocketIO(io);
// parse body params and attache them to req.body
app.use(bodyParser.json({ limit: '50mb' }));
app.use(
    bodyParser.urlencoded({
        limit: '50mb',
        extended: true,
        parameterLimit: 50000
    })
);

app.use(cookieParser());
app.use(compress());
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing

var corsOptions = {
    origin: [
        'http://www.myshareholdings.com',
        'https://share-holding-phi.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001',
        'https://verga.vercel.app',
        'http://3.80.76.37'
    ],
    credentials: true
};

app.use(cors(corsOptions));
app.set('view engine', 'ejs');
// app.use(cors());

// // enable detailed API logging in dev env
// if (config.env === "development") {
// 	expressWinston.requestWhitelist.push("body");
// 	expressWinston.responseWhitelist.push("body");
// 	app.use(
// 		expressWinston.logger({
// 			winstonInstance,
// 			meta: true, // optional: log meta data about request (defaults to true)
// 			msg: "HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms",
// 			colorStatus: true, // Color the status code (default green, 3XX cyan, 4XX yellow, 5XX red).
// 		})
// 	);
// }

// mount all routes on /api path
app.use('/api', routes);

app.get('/', (req, res) => res.status(200).send('OK working fine!!'));
// if error is not an instanceOf APIError, convert it.
app.use((err, req, res, next) => {
    if (err instanceof expressValidation.ValidationError) {
        // validation error contains errors which is an array of error each containing message[]
        const unifiedErrorMessage = err.details.body.map((error) => error.message).join(' and ');
        const error = new APIError(unifiedErrorMessage, err.status, true);
        return next(error);
    } else if (!(err instanceof APIError)) {
        const apiError = new APIError(err.message, err.status, err.isPublic);
        return next(apiError);
    }
    return next(err);
});

// catch 404 and forward to error handler

app.use((req, res, next) => {
    req.io = io;
    return next();
});

process.env.TZ = 'Canada/Central';

// error handler, send stacktrace only during development
app.use(
    (
        err,
        req,
        res,
        next // eslint-disable-line no-unused-vars
    ) => {
        res.status(err.status).json({
            status: false,
            message: err.isPublic ? err.message : httpStatus[err.status],
            stack: config.env === 'development' ? err.stack : {},
            data: null
        });
    }
);

module.exports = server;
