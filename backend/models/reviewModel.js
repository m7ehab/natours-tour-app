const mongoose = require('mongoose');
const Tour = require('./tourModel');
const reviewSchema = new mongoose.Schema(
  {
    review: { type: String, required: [true, 'Review should not be null'] },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    createdAt: { type: Date, default: Date.now() },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review should belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review should belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//to make user write on review only on each tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name' });
  next();
});
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour', // value of tour in each doc
        nRating: { $sum: 1 }, // added 1 for each doc
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};
reviewSchema.post('save', function () {
  // this.constr points to current review schema
  this.constructor.calcAverageRatings(this.tour);
});

// Update
reviewSchema.post(/^findOneAnd/, async function (doc) {
  // doc is the updated document
  await this.model.calcAverageRatings(doc.tour);
});

// reviewSchema.pre(/^find/, function (next) {
//   this.populate({ path: 'tour', select: 'name' });
//   next();
// });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
