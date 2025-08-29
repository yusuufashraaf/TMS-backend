const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const joi = require("joi");

// Validation schema for creating/updating task
const taskSchema = joi.object({
  projectId: joi.string().hex().length(24).required(),
  title: joi.string().max(200).required(),
  description: joi.string().max(1000).optional(),
  priority: joi.string().valid("Low", "Medium", "High").required(),
  status: joi
    .string()
    .valid("Pending", "In Progress", "Completed")
    .default("Pending"),
  deadline: joi.date().optional(),
  assignedTo: joi.string().hex().length(24).optional(),
});

// Helper function to check if all assigned users exist
const validateUsersExist = async (users) => {
  if (!users || users.length === 0) return true;
  const existingUsers = await User.find({ _id: { $in: users } });
  return existingUsers.length === users.length;
};
// Helper to check if assigned user exists
const validateUserExist = async (userId) => {
  if (!userId) return true;
  const user = await User.findById(userId);
  return !!user;
};

// Create Task
exports.createTask = async (req, res) => {
  try {
    const { error, value } = taskSchema.validate(req.body);
    if (error)
      return res.status(400).json({
        status: "failed",
        message: error.details.map((d) => d.message),
      });

    // Check project exists
    const project = await Project.findById(value.projectId);
    if (!project) {
      return res.status(404).json({
        status: "failed",
        message: "Project not found",
      });
    }

    // Check assigned user exists
    if (value.assignedTo) {
      const userExists = await User.findById(value.assignedTo);
      if (!userExists) {
        return res.status(400).json({
          status: "failed",
          message: "Assigned user does not exist",
        });
      }
    }

    const task = await Task.create({
      ...value,
      createdBy: req.user.id,
    });

    // --- Socket.IO notification ---
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    if (value.assignedTo) {
      const socketId = onlineUsers.get(value.assignedTo);
      if (socketId) {
        io.to(socketId).emit("new-task", {
          message: "You have a new task assigned!",
          task,
        });
      }
    }

    res.status(201).json({ status: "success", data: task });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    let { status, priority, sortBy, page = 1, limit = 10 } = req.query;
    page = Math.max(parseInt(page, 10) || 1);
    limit = Math.max(parseInt(limit, 10) || 10);

    // Query object
    const query = {}; // empty = all tasks

    if (status) query.status = status;
    if (priority) query.priority = priority;

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sortBy) {
      sortOptions = {};
      sortBy.split(",").forEach((fieldDir) => {
        const [field, dir] = fieldDir.split(":");
        if (["deadline", "priority", "createdAt"].includes(field)) {
          sortOptions[field] = dir === "desc" ? -1 : 1;
        }
      });
    }

    const tasks = await Task.find(query)
      .populate("projectId", "name")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort(sortOptions);

    const total = await Task.countDocuments(query);

    res.status(200).json({
      status: "success",
      results: tasks.length,
      total,
      page,
      data: tasks,
    });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

// Get single task (only if related to user)
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [{ createdBy: req.user.id }, { assignedTo: req.user.id }],
    })
      .populate("projectId", "name")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    if (!task) {
      return res.status(404).json({
        status: "failed",
        message: "Task not found",
      });
    }

    res.status(200).json({ status: "success", data: task });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

// Update task (only if related to user)
exports.updateTask = async (req, res) => {
  try {
    const { error, value } = taskSchema.validate(req.body, {
      presence: "optional",
    });
    if (error)
      return res.status(400).json({
        status: "failed",
        message: error.details.map((d) => d.message),
      });

    // Only allow assignedTo as string (userId)
    if (value.assignedTo) {
      if (typeof value.assignedTo === "object" && value.assignedTo._id) {
        value.assignedTo = value.assignedTo._id;
      }

      const userExists = await validateUserExist(value.assignedTo);
      if (!userExists)
        return res.status(400).json({
          status: "failed",
          message: "Assigned user does not exist",
        });
    }

    // Prevent _id from being updated
    delete value._id;

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [{ createdBy: req.user.id }, { assignedTo: req.user.id }],
      },
      value,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        status: "failed",
        message: "Task not found or not authorized",
      });
    }

    res.status(200).json({ status: "success", data: task });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};
// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!task) {
      return res.status(404).json({
        status: "failed",
        message: "Task not found or you are not authorized to delete",
      });
    }

    await task.deleteOne();

    res.status(200).json({
      status: "success",
      message: "Task deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    // Total tasks
    const totalTasks = await Task.countDocuments();

    // Completed tasks
    const completedTasks = await Task.countDocuments({ status: "Completed" });

    // Pending tasks
    const pendingTasks = await Task.countDocuments({ status: "Pending" });

    // Overdue tasks not completed and deadline passed
    const overdueTasks = await Task.countDocuments({
      status: { $ne: "Completed" },
      deadline: { $lt: new Date() },
    });

    // Tasks created this month
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    const endOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0
    );

    const tasksThisMonth = await Task.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    // Priority counts
    const highPriority = await Task.countDocuments({ priority: "High" });
    const mediumPriority = await Task.countDocuments({ priority: "Medium" });
    const lowPriority = await Task.countDocuments({ priority: "Low" });

    const priorityData = [
      { name: "High", value: highPriority },
      { name: "Medium", value: mediumPriority },
      { name: "Low", value: lowPriority },
    ];

    res.status(200).json({
      status: "success",
      data: {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        tasksThisMonth,
        priorityData,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    let { status, priority, sortBy, page = 1, limit = 10 } = req.query;
    page = Math.max(parseInt(page, 10) || 1);
    limit = Math.max(parseInt(limit, 10) || 10);

    const query = {
      assignedTo: req.user.id,
    };

    if (status) query.status = status;
    if (priority) query.priority = priority;

    let sortOptions = { createdAt: -1 };
    if (sortBy) {
      sortOptions = {};
      sortBy.split(",").forEach((fieldDir) => {
        const [field, dir] = fieldDir.split(":");
        if (["deadline", "priority", "createdAt"].includes(field)) {
          sortOptions[field] = dir === "desc" ? -1 : 1;
        }
      });
    }

    const tasks = await Task.find(query)
      .populate("projectId", "name")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort(sortOptions);

    const total = await Task.countDocuments(query);

    res.status(200).json({
      status: "success",
      results: tasks.length,
      total,
      page,
      data: tasks,
    });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

exports.updateMyTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Pending", "In Progress", "Completed"].includes(status)) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid status" });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, assignedTo: req.user.id },
      { status },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({
        status: "failed",
        message: "Task not found or not assigned to you",
      });
    }

    res.status(200).json({ status: "success", data: task });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};
