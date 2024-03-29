const express = require('express');
const userRouter = express.Router();
const userController = require('./../Controllers/userController');
const authController = require('./../Controllers/authController');

userRouter.route('/signUp').post(authController.signUp);
userRouter.route('/signin').post(authController.signIn);
userRouter.route('/forgetpassword').post(authController.forgetPassword);
userRouter.route('/resetpassword/:token').patch(authController.resetPassword);

// PROTECTING ALL BELOW ROUTES
userRouter.use(authController.protectRoute);

userRouter.route('/updatepassword').patch(authController.updatePassword);

userRouter.route('/me').get(userController.getMe, userController.getUserById);

userRouter.route('/updateMe').patch(userController.updateMe);

userRouter.route('/deleteMe').delete(userController.deleteMe);

userRouter.use(authController.restrictTo('admin'));

userRouter
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.addUser);

userRouter
  .route('/:id')
  .get(userController.getUserById)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = userRouter;
