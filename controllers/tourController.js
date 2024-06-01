// const fs = require('fs');

const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
// const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const handlerFactory = require('./handlerFactory');

//// ----- Was doing this ealier without DB
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`),
// );

//middleware function to check if valid id
// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour id is ${val}`);
//   // if (req.params.id * 1 > tours.length) {
//   //   return res.status(404).json({
//   //     status: 'fail',
//   //     message: 'Invalid Id',
//   //   });
//   // }
//   next();
// };

//middleware to checkbody
// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     res.status(400).json({
//       status: 'fail',
//       message: 'Name or price not availbale in request',
//     });
//   }
//   next();
// };
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// exports.getAllTours = catchAsync(async (req, res) => {
//   //BUILD QUERY
//   // 1a)  FILTERING
//   // const queryObj = { ...req.query }; // create a deep copy

//   // const excludedFields = ['page', 'sort', 'limit', 'fields']; //excluded field when querying
//   // excludedFields.forEach((e) => delete queryObj[e]);

//   // // 1b) ADVANCED FILTERING
//   // let querySrt = JSON.stringify(queryObj);
//   // querySrt = querySrt.replace(
//   //   /\b(gte|gt|lte|lte)\b/g,
//   //   (match) => `$${match}`,
//   // );
//   // console.log(JSON.parse(querySrt));

//   //{difficulty: 'easy', duration: { $gte:5 } }
//   //gte, gt, lte, lt

//   // EXECUTE QUERY
//   // let query = Tour.find(JSON.parse(querySrt)); //returns query object, dont use await here as it returns array type object and
//   //we cant use it for later pagination or sort etc

//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const tours = await features.query;

//   ////----- another way to filter
//   // const query = Tour.find()
//   //   .where('duration')
//   //   .equals(5)
//   //   .where('difficulty')
//   //   .equals('easy');

//   //SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: {
//       tours, // the key name should be same as the resource endpoint
//     },
//   });
// });

exports.getTour = handlerFactory.getOne(Tour, { path: 'reviews' });
//   console.log(req);
// const id = req.params.id * 1;
// const tour = tours.find((el) => el.id == id);
// res.status(200).json({
//   status: 'success',
//   data: {
//     tour, // the key name should be same as the resource endpoint
//   },
// });
// );

exports.getAllTours = handlerFactory.getAll(Tour);
exports.createTour = handlerFactory.createOne(Tour);

// try {
//   // const newTour = new Tour({});
//   // newTour.save();

// } catch (err) {
//   res.status(400).json({
//     status: 'fail',
//     message: err,
//   });
// }
// });

// //normal way without catchAsync function
// exports.updateTour = async (req, res) => {
//   try {
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//       new: true, //returns new document
//       runValidators: true,
//     });
//     res.status(200).json({
//       status: 'success',
//       data: {
//         tour,
//       },
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: 'fail',
//       message: err,
//     });
//   }

// res.status(200).json({
//   status: 'success',
//   data: {
//     tour: '<Updated tour here>',
//   },
// });
// };

exports.updateTour = handlerFactory.updateOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour found with that id', 404));
//   }

//   res.status(204).json({
//     //204 means no content
//     status: 'success',
//     data: null,
//   });
// });
exports.deleteTour = handlerFactory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' }, // to group by
        numTours: { $sum: 1 }, // to count number of tours we sum 1 for each
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          // should be within that year
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

/// tours-within/:distance/centre/:latlng/:unit
// /tours-within/223/center/43.470332,-80.542635/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, center, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400,
      ),
    );
  }
  // console.log(distance, lat, lng, unit);

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  // we will query for start location
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400,
      ),
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      //to project like in SQL
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
