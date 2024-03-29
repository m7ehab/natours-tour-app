const User = require('../models/userModel');
const AppError = require('../utilities/AppError');
const catchAsync = require('../utilities/catchAsync');
const factory = require('./handlerFactory');

exports.updateMe = catchAsync(async (req, res, next) => {
  const { name, email } = req.body;
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { name, email },
    { new: true, runValidators: true }
  );
  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  console.log(req.params);
  next();
};

exports.deleteMe = factory.deleteOne(User);
exports.getAllUsers = factory.getAll(User);
exports.addUser = factory.createOne(User);
exports.getUserById = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
