const User = require("../models/User");
const joi = require("joi");
const jwt = require("jsonwebtoken");

// Validation Schemas
const signupSchema = joi.object({
  name: joi.string().max(50).required(),
  email: joi.string().email().required(),
  password: joi
    .string()
    .min(12)
    .pattern(new RegExp("^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])"))
    .required(),
  role: joi.string().valid("Admin", "User").optional(),
});

const loginSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().required(),
});

// Internal JWT generator
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

// Signup Controller
exports.signup = async (req, res) => {
  try {
    const { error, value } = signupSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({ status: "failed", message: errors });
    }

    // Check if email exists
    const existingEmail = await User.findOne({ email: value.email });
    if (existingEmail) {
      return res.status(400).json({
        status: "failed",
        message: `Email ${value.email} already exists`,
      });
    }

    const user = await User.create(value);
    const { password, ...userData } = user.toObject();

    const token = generateToken(user);

    res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: { user: userData, token },
    });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

// Login Controller
exports.login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({ status: "failed", message: errors });
    }

    const { email, password } = value;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res
        .status(401)
        .json({ status: "failed", message: "Email or Password is incorrect" });
    }

    const token = generateToken(user);

    res.status(200).json({
      status: "success",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

// Logout Controller
exports.logout = async (req, res) => {
  try {
    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};
