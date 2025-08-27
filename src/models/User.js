const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\S+@\S+\.\S+$/,
        "Please provide a valid email address. ex:youremail@domain.extension",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [12, "Password must be at least 8 characters long"],
      validate: {
        validator: function (value) {
          return /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(value);
        },
        message:
          "Password must contain at least 1 uppercase letter, 1 number, and 1 special character",
      },
      select: false,
    },
    role: {
      type: String,
      enum: ["Admin", "User"],
      default: "User",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
