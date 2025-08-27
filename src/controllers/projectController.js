const Project = require("../models/Project");
const User = require("../models/User");
const mongoose = require("mongoose");
const Task = require("../models/Task");
const joi = require("joi");

// Validation schema for creating/updating project
const projectSchema = joi.object({
  name: joi.string().max(100).required(),
  description: joi.string().max(1000).required(),
  members: joi.array().items(joi.string().hex().length(24)),
});

// Helper function for DRY
const validateMembersExist = async (members) => {
  if (!members || members.length === 0) return true;
  const existingMembers = await User.find({ _id: { $in: members } });
  return existingMembers.length === members.length;
};

// Create project
exports.createProject = async (req, res) => {
  try {
    const { error, value } = projectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: "failed",
        message: error.details.map((err) => err.message),
      });
    }

    const { name, description, members } = value;

    const membersValid = await validateMembersExist(members);
    if (!membersValid)
      return res.status(400).json({
        status: "failed",
        message: "Some members do not exist",
      });

    const project = await Project.create({
      name,
      description,
      createdBy: req.user.id,
      members,
    });

    res.status(201).json({ status: "success", data: project });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    let { page = 1, limit = 10, search } = req.query;
    page = Math.max(parseInt(page, 10) || 1);
    limit = Math.max(parseInt(limit, 10) || 10);
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      };
    }

    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email")
      .populate("members", "name email");

    const total = await Project.countDocuments(query);

    res.status(200).json({
      status: "success",
      results: projects.length,
      total,
      page,
      data: projects,
    });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

// Get project by ID
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("members", "name email");

    if (!project) {
      return res
        .status(404)
        .json({ status: "failed", message: "Project not found" });
    }

    res.status(200).json({ status: "success", data: project });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

// Update project (any authenticated user can update)
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res
        .status(404)
        .json({ status: "failed", message: "Project not found" });
    }

    const { error, value } = projectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: "failed",
        message: error.details.map((d) => d.message),
      });
    }

    const { members } = value;
    const membersValid = await validateMembersExist(members);
    if (!membersValid)
      return res.status(400).json({
        status: "failed",
        message: "Some members do not exist",
      });

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      value,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({ status: "success", data: updatedProject });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const project = await Project.findById(req.params.id).session(session);
    if (!project) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ status: "failed", message: "Project not found" });
    }

    // Delete all tasks belonging to this project
    await Task.deleteMany({ project: project._id }).session(session);

    // Delete the project
    await project.deleteOne({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: "success",
      message: "Project and its tasks deleted successfully",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ status: "failed", message: err.message });
  }
};
