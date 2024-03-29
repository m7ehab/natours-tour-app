const catchAsync = require('../utilities/catchAsync');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const AppError = require('../utilities/AppError');
const sendEmail = require('../utilities/email');
const { promisify } = require('util');
const crypto = require('crypto');

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_PERIOD,
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const { name, email, photo, password, passwordConfirm } = req.body;

  const newUser = await User.create({
    name,
    email,
    photo,
    password,
    passwordConfirm,
  });
  const token = createToken(newUser._id);
  res.status(201).json({
    status: 'success',
    data: {
      user: newUser,
      token: token,
    },
  });
});

exports.signIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide password and email', 400));
  }
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password, user.password))) {
    return next(new AppError('Email or password is wrong', 401));
  }
  const token = createToken(user._id);

  res.status(200).json({
    status: 'success',
    data: {
      token,
    },
  });
});

exports.protectRoute = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in ! Please log', 401));
  }
  //verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  console.log(decoded);

  //check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('User is not exist', 401));
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      console.log(roles, req.user.role);
      return next(
        new AppError('You dont have the permission to do this!', 403)
      );
    }
    next();
  };
};
exports.forgetPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email addres', 404));
  }
  //generate random token to change password =>
  const restToken = user.createPasswordRestToken();
  await user.save({ validateBeforeSave: false });

  const url = `${req.protocol}://${req.get('host')}/api/v1/users/${restToken}`;
  const message = `Dear ${user.name},
  We hope this email finds you well. It appears that you have requested a password reset for your account on Natours. To proceed with resetting your password, please follow the instructions below:
  Click on the following link to access the password reset page: ${url}
  Please note that this link is valid for the next 10 mintues. After this period, you will need to request another password reset.
  If you did not initiate this password reset request, please disregard this email.`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'REST YOUR PASSWORD !',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpries = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //find user by token
  const restToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  console.log(restToken);
  const user = await User.findOne({
    passwordResetToken: restToken,
    passwordResetExpries: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid !', 400));
  }
  //update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetExpries = undefined;
  user.passwordResetToken = undefined;
  await user.save();

  const token = createToken(user._id);

  res.status(200).json({
    status: 'success',
    data: {
      token,
    },
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //get user
  const { password, newPassword, passwordConfirm } = req.body;

  const user = await User.findOne({ _id: req.user._id }).select('+password');

  if (!user) {
    return next(new AppError('Please log in first ! ', 401));
  }
  if (!(await user.comparePassword(password, user.password))) {
    return next(new AppError('Your current password is wrong !', 400));
  }
  user.password = newPassword;
  user.passwordConfirm = passwordConfirm;
  await user.save();
  res.status(201).json({
    status: 'success',
    email: user.email,
  });
});
