const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

//name, email, photo, password, passwordConfirm

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name'],
    },
    email: {
      type: String,
      required: [true, 'Please enter your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    photo: String,
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      default: 'default.jpg',
      required: [true, 'Please provide password'],
      minlength: 8,
      select: false, //will make sure it never shows up in any output
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm password'],
      validate: {
        //This only works on CREATE and SAVE!!
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords are not the same',
      },
    },
    passwordChangeAt: Date, //to check the time at which password was changed
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.pre('save', async function (next) {
  //Only run function if password was modified
  if (!this.isModified('password')) return next();

  //Hash the password with cost of 12 - Even if pswd if same, hash wont be same due to salting
  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined; //to delete it. We only nneded the passwordConfirm to check

  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangeAt = Date.now() - 1000; //subtract 1s to make sure password change is before jwt token creating
  next();
});

//Query midddleware to not show any inactive users
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword); //userPassword is hashed
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangeAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangeAt.getTime() / 1000,
      10,
    );
    console.log(changedTimeStamp, JWTTimestamp);
    return JWTTimestamp < changedTimeStamp;
  }

  //False means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //we need 10min validity of token

  return resetToken; //send the unencrypted one to the user
};

const User = mongoose.model('User', userSchema);

module.exports = User;
