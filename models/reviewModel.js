const mongoose = require('mongoose');
const Tour = require('./tourModel');

// review / rating / createdAt / red to tour / ref to user

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      require: [true, 'The review is missing'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); // index on tour & user and each user can only review each tour once

reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //     path: 'tour',
  //     select: '-guides -guides name',
  //   }).populate({
  //     path: 'user',
  //     select: 'name photo',
  //   });

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    //match stage choose field
    {
      $match: { tour: tourId },
    },
    //group stage
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 }, //number of ratings: 1 will be added for each grouped soc
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nrating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// pass data from pre to post middleware.
reviewSchema.pre(/^findOneAnd/, async function (next) {
  //await this.findOne(); does NOT work here as query has already been executed
  this.r = await this.clone().findOne();
  next();
});
reviewSchema.post(/^findOneAnd/, async function (next) {
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

reviewSchema.post('save', function () {
  //this points to current review -- we use .constructor as REview is called later
  this.constructor.calcAverageRatings(this.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
