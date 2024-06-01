const Review = require('../models/reviewModel');
// const appError = require('../utils/appError');
// const catchAsync = require('../utils/catchAsync');
const handlerFactory = require('./handlerFactory');

//get all review and create new review
exports.getAllReviews = handlerFactory.getAll(Review);

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getReview = handlerFactory.getOne(Review);
exports.createReview = handlerFactory.createOne(Review);
exports.updateReview = handlerFactory.updateOne(Review);
exports.deleteReview = handlerFactory.deleteOne(Review);
