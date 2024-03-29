const Review = require('./../models/reviewModel');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/AppError');
const factory = require('./handlerFactory');

exports.getReviews = factory.getAll(Review);

exports.addReview = catchAsync(async (req, res) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  const newReview = await Review.create(req.body);
  res.status(201).json({
    status: 'sucsses',
    data: { newReview },
  });
});

exports.getReviewById = factory.getOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
