const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid  ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const [errorField, errorValue] = Object.entries(err.keyValue).flat();
  const message = `Duplicate '${errorField}' field with value of '${errorValue}' entered. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please login again', 401);

const handleJWTExpired = () =>
  new AppError('Token expired. Please login again', 401);

const sendErrorDev = (err, req, res) => {
  //API
  console.log(req.original);
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      err: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // RENDERED WEBSITE
    return res.status(err.statusCode).render('error', {
      title: 'There has been a error',
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  //Operational, trusted error: send message to client
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });

      //Programming or other unknown error : dont leak error details to user
    } else {
      //1) Log error
      console.error('ERROR!', err);

      //2) Send generic error
      return res.status(500).json({
        status: 'error',
        message: 'Something went wrong',
      });
    }
  } else {
    // RENDERED WEBSITE
    res.status(err.statusCode).render('error', {
      title: 'There has been a error',
      msg: 'Please try again later',
    });
  }
};

module.exports = (err, req, res, next) => {
  //   console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.create(err);

    if (error.name === 'CastError') error = handleCastErrorDB(error);

    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpired();

    sendErrorProd(error, req, res);
  }
};
