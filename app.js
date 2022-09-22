const express = require('express');
const app = express();
const mongoose = require('mongoose');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');
require('express-async-errors');
require('colors');
const setAndCheckConfig = require('./setup');
setAndCheckConfig();
const processingFeeds = require('./src/server/main');

app.use(cors({ credentials: true, origin: 'http://localhost:4200' }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.set('views', './src/client/views');
app.use(cookieParser());

/* Routes api */
const usersRoutes = require('./src/api/routes/users');
const feedsRoutes = require('./src/api/routes/feeds');
const subscriptionsRoutes = require('./src/api/routes/subscriptions');

app.use('/api/users', usersRoutes);
app.use('/api/feeds', feedsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.get('/api/status', (req, res) => res.status(200).json({ message: 'OK' }));
app.all('/api/*', (req, res) => res.status(404).json({ message: 'Not found' }));

/* client */
const checkLoginClient = require('./src/client/middlewares/checkLogin');
const checkVerificationClient = require('./src/client/middlewares/checkVerification');
const renders = {
    main: require('./src/client/renders/main'),
    verify: require('./src/client/renders/verify'),
    unsubscribe: require('./src/client/renders/unsubscribe')
};

app.use(express.static('src/client/views', { index: false }));
app.use('/images', express.static('src/client/images'));
app.use('/assets', express.static('src/client/assets'));
app.get('/login', checkLoginClient, (req, res) => res.sendFile(path.join(__dirname, 'src/client/views/login', 'index.html')));
app.get('/verify', checkLoginClient, checkVerificationClient, renders.verify);
app.get('/unsubscribe', checkLoginClient, checkVerificationClient, renders.unsubscribe);
app.get('/', checkLoginClient, checkVerificationClient, renders.main);
app.all('*', (req, res) => res.status(404).sendFile(path.join(__dirname, 'src/client/views', '404.html')));

app.use((error, req, res, next) => {
    res.status(500).json({
        message: process.env.NODE_ENV !== 'production' ? error.message : 'Internal server error'
    });
});

/**
* Run Back And base
*/
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
(async () => {
    console.log('connecting to mongo...');
    await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    console.log('mongoDB connected!');

    /**
     * Listening server
     */
    const http = require('http');
    const port = process.env.PORT;
    const server = http.createServer(app);
    server.listen(port);
    console.log(`Server is running on port: ${port}. public url: ${process.env.APP_SITE_ADDRESS}`);

    /**
    * run background process
    */
    do {
        const resp = await processingFeeds();
        const ms = 1000 * 60 * 1; // 1 minute
        if (resp === 'Wait!') {
            console.log(`Waiting ${ms} milliseconds...`);
            await sleep(ms);
            console.log('Waiting completed!');
        }
    } while (true);
})();