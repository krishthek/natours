const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('express-xss-sanitizer');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// define view engine(for templates)
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1)Global MIDDLEWARES

//for serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set Security HTTP Headers
// const csp1 = helmet.contentSecurityPolicy({});
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'script-src': [
          "'self'",
          'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
          'https://unpkg.com',
          'https://cdnjs.cloudflare.com',
        ],
        'style-src': [
          "'self'",
          'https://*.googleapis.com',
          'https://unpkg.com',
        ],
        'img-src': [
          "'self'",
          'data:',
          'https://*.openstreetmap.org',
          'https://unpkg.com',
        ],
        // 'font-src': ["'self'", 'https://fonts.googleapis.com'],
        // 'connect-src': ["'self'", 'https://api.mapbox.com'],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'self'"],
        // defaultSrc: ["'self'"],
      },
    },
    // crossOriginEmbedderPolicy: false, // If required
    // crossOriginResourcePolicy: { policy: 'cross-origin' }, // If required
  }),
);

// Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests frpm same IP address - Rate Limiter
const limiter = rateLimit({
  max: 100, // max 100 requests from same IP
  windowMs: 60 * 60 * 1000, //1 hr in milliseconds
  message: 'Too many requests from this IP, please try again in an hour',
});
app.use('/api', limiter); //affters everything that starts with /api

// Body parser, reading data from bodt into req.body
app.use(express.json({ limit: '10kb' })); //middleware
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10kb' })); //Parse data coming from a url encoded form

//Data sanitization against NoSQL query injections
app.use(mongoSanitize()); //will esentially remove stuff like $ etc

// Data sanitization against XSS
app.use(xss.xss());

//Prevent parameter pollution
//Add whitelist so that we can use field twice
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// // Custome middleware
// app.use((req, res, next) => {
//   //   console.log('Hello from the middleware ;)');
//   next();
// });

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  // console.log(req.headers);
  next();
});

// 2) ROUTE HANDLERS

// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// 3) ROUTES

//pug template engine stuff
app.use('/', viewRouter);
// use router after declaring - mounting it
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// request url wasnt matching the previous so code reached here
app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server.`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
});

//ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;
