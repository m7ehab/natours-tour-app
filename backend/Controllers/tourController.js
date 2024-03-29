const { DESTRUCTION } = require('node:dns');
const Tour = require('./../models/tourModel');
const AppError = require('../utilities/AppError');
const factory = require('./handlerFactory');
const catchAsync = require('./../utilities/catchAsync');
exports.getAllTours = factory.getAll(Tour);

exports.getTourById = factory.getOne(Tour, 'reviews');

exports.addTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRating: { $sum: '$ratingsQuantity' },
        maxPrice: { $max: '$price' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        avgRating: { $avg: '$ratingsAverage' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: stats,
  });
  next();
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.id * 1;
  const tours = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },

    {
      $group: {
        _id: '$startDates',
        numTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $sort: {
        numTours: -1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: tours,
  });

  next();
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = distance / 6378.1; // raduis in kg
  console.log(req.params);
  if (!lat || !lng) {
    next(new AppError('please provide lat and lng', 400));
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
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
        distanceMultiplier: 0.001,
      },
    },
    {
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
