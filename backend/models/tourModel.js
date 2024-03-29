const mongoose = require('mongoose');
const slugify = require('slugify');

// define schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Must be not null'],
      unique: true,
    },
    isSecert: {
      type: Boolean,
      default: false,
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'must not be null'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'must not be null'],
    },
    difficulty: {
      type: String,
      required: [true, 'Must be not null'],
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'Must be not null'],
    },
    imageCover: {
      type: String,
      required: [true, 'Must be not null'],
    },
    images: [String],
    description: {
      type: String,
      trim: true,
      required: [true, 'Must be not null'],
    },
    priceDiscount: {
      type: Number,
      validator: function (val) {
        return this.price > val;
      },
      message: 'Discount Price below regular price ',
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    ratingsAverage: {
      type: Number,
      default: 4.5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'must not be null'],
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: {
      type: {
        type: String,
        default: 'point',
        enum: ['point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number,
    },
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});
//virtual view for reviews
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.find({ isSecert: { $ne: true } });
  next();
});
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// tourSchema.post('save', function (doc, next) {
//   console.log(doc, ' this doc has been saved');
//   next();
// });
//define model
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
