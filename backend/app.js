require('dotenv').config();
const tourRouter = require('./Routes/tourRoute');
const userRouter = require('./Routes/userRoute');
const reviewRouter = require('./Routes/reviewRoute');
const AppError = require('./utilities/AppError');
const errorController = require('./Controllers/errorController');

const express = require('express');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const app = express();

const limiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  message: 'To many requests from one IP .. try again after a while',
});

app.use(helmet());
app.use(limiter);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize()); // prevent mongo queires

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.all('*', (req, res, next) => {
  next(new AppError(`cant find ${req.originalUrl} on this server`, 404)); // next recieves errors only and passes it to midleware handller and skip all other middlware in stack and goes to handller midllware
});
app.use(errorController);
module.exports = app;
