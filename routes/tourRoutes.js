const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// router.param('id', tourController.checkID);

// POST /tour/12fdf4/reviews
// GET /tour/12fdf4/reviews
router.use('/:tourId/reviews', reviewRouter); //user reviewRouter if you see something like '/:tourId/reviews

// Create a checkbody middleware for createTour
// check if body contains name nd price property
// if not, send back 400 (bad request)

// alias for popular query
router
  .route('/top-5-cheap-tours')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan,
  );

//find tours within certain certain parameters
router
  .route('/tours-within/:distance/centre/:latlng/:unit')
  .get(tourController.getToursWithin);
// we can also do it with query strings

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );
// .post(tourController.checkBody, tourController.createTour); //added another middleware

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  ); //protect from unauthorized users

module.exports = router;
