const express = require('express');
const reveiwRouter = express.Router({ mergeParams: true });
const reviewController = require('./../Controllers/reviewController');
const authCotroller = require('./../Controllers/authController');
reveiwRouter
  .route('/')
  .get(reviewController.getReviews)
  .post(
    authCotroller.protectRoute,
    authCotroller.restrictTo('user'),
    reviewController.addReview
  );

reveiwRouter
  .route('/:id')
  .get(reviewController.getReviewById)
  .delete(
    authCotroller.protectRoute,
    authCotroller.restrictTo('user', 'admin'),
    reviewController.deleteReview
  )
  .patch(
    authCotroller.protectRoute,
    authCotroller.restrictTo('user', 'admin'),
    reviewController.updateReview
  );

module.exports = reveiwRouter;
