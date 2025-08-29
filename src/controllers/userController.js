const User = require("../models/User");
const joi = require("joi");

// Validate user's data before sending to database (for updates)
const userUpdateSchema = joi.object({
  name: joi.string().max(50).optional(),
  email: joi.string().email().optional(),
  password: joi
    .string()
    .min(12)
    .pattern(new RegExp("^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])"))
    .optional(),
  role: joi.string().valid("Admin", "User").optional(),
});

// Get all users with pagination
exports.getAllUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 1);
    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments();
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      status: "success",
      message: "Users retrieved successfully",
      page,
      limit,
      total: totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      data: users,
    });
  } catch (err) {
    res
      .status(500)
      .json({ status: "failed", message: err.message, data: null });
  }
};

// Get a single user by ID and exclude password
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: `User with ID ${id} not found`,
        data: null,
      });
    }

    res.status(200).json({
      status: "success",
      message: "User retrieved successfully",
      data: user,
    });
  } catch (err) {
    res
      .status(500)
      .json({ status: "failed", message: err.message, data: null });
  }
};

// Update a user by ID
exports.updateUser = async (req, res) => {
  try {
    const { error, value } = userUpdateSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((err) => err.message);
      return res
        .status(400)
        .json({ status: "failed", message: errors, data: null });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: `User with ID ${req.params.id} not found`,
        data: null,
      });
    }

    // Update fields if provided
    if (value.name) user.name = value.name;
    if (value.email) user.email = value.email;
    if (value.role) user.role = value.role;
    if (value.password) user.password = value.password;

    await user.save();
    const { password, ...userData } = user.toObject();
    res.status(200).json({
      status: "success",
      message: "User updated successfully",
      data: userData,
    });
  } catch (err) {
    res
      .status(500)
      .json({ status: "failed", message: err.message, data: null });
  }
};

// Delete a user by ID
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: `User with ID ${req.params.id} not found`,
        data: null,
      });
    }

    await user.deleteOne();

    res.status(200).json({
      status: "success",
      message: `User with ID ${req.params.id} deleted successfully`,
      data: null,
    });
  } catch (err) {
    res
      .status(500)
      .json({ status: "failed", message: err.message, data: null });
  }
};
