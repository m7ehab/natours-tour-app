const express = require('express');
const tourController = require('./../Controllers/tourController');
const authController = require('./../Controllers/authController');
const reviewsRouter = require('./../Routes/reviewRoute');
const tourRouter = express.Router();
// tourRouter.param('id', tourController.checkId);
tourRouter.route('/tour-stats').get(tourController.getStats);
tourRouter.route('/month-plan').get(tourController.getMonthlyPlan);
tourRouter
  .route('/')
  .get(authController.protectRoute, tourController.getAllTours)
  .post(
    authController.protectRoute,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.addTour
  );
tourRouter
  .route('/tours-within/:distance/center/:latlng/')
  .get(tourController.getToursWithin);

tourRouter.route('/distances/:latlng/').get(tourController.getDistances);

tourRouter
  .route('/:id')
  .get(tourController.getTourById)
  .patch(
    authController.protectRoute,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protectRoute,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );
//NESTED ROUTE
tourRouter.use('/:tourId/reviews', reviewsRouter);

module.exports = tourRouter;
