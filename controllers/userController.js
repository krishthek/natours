const User = require('../models/userModel');
const sharp = require('sharp');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const handlerFactory = require('./handlerFactory');
const multer = require('multer');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     //user-id-timestamp.jpeg
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage(); // image will be stored in buffer

//We should only allow image files - so we use a filter
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb((new AppError('Not an image. Please only upload images', 400), false));
  }
};

//Where images are saved to disk in filesystem- is middleware
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`; //setting the filename so middleware can access it;

  //getting image from buffer, process and then save to disk
  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

const filterObj = (myObj, ...allowedFields) => {
  const newFilterObj = {}; //emoty object
  Object.keys(myObj).forEach((element) => {
    if (allowedFields.includes(element)) {
      newFilterObj[element] = myObj[element];
    }
    // console.log(newFilterObj);
  });
  return newFilterObj;
};

//middleware before handlerFactory.getOne
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Error is user tries to update passwords
  if (req.body.password || req.body.passwordConfirm) {
    next(
      new AppError(
        'Cannot update password here. Please use the password Update API.',
        400,
      ),
    );
  }

  //2) Filter body so that we only can update name and email
  const filteredUser = filterObj(req.body, 'name', 'email');
  if (req.file) filteredUser.photo = req.file.filename; // to update photoname
  // 3) find and update
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredUser, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser, // the key name should be same as the resource endpoint
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined yet! Please use signup instead.',
  });
};

exports.getAllUsers = handlerFactory.getAll(User);
//Do not update passwords with this!
exports.updateUser = handlerFactory.updateOne(User);

exports.deleteUser = handlerFactory.deleteOne(User);
exports.getUser = handlerFactory.getOne(User);
