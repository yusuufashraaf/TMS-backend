const Project = require("../models/Project");
const User = require("../models/User");
const mongoose = require("mongoose");
const Task = require("../models/Task");
const joi = require("joi");

// Validation schema for creating/updating project
const projectSchema = joi.object({
  name: joi.string().max(100).required(),
  description: joi.string().max(1000).required(),
  members: joi.array().items(joi.string().hex().length(24)).optional(),
});

// Helper function to check if all members exist
const validateMembersExist = async (members) => {
  if (!members || members.length === 0) return true;
  const existingMembers = await User.find({ _id: { $in: members } });
  return existingMembers.length === members.length;
};

// ---------------------- Create Project ----------------------
exports.createProject = async (req, res) => {
  try {
    const { error, value } = projectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: "failed",
        message: error.details.map((err) => err.message),
      });
    }

    const membersValid = await validateMembersExist(value.members);
    if (!membersValid)
      return res.status(400).json({
        status: "failed",
        message: "Some members do not exist",
      });

    const project = await Project.create({
      ...value,
      createdBy: req.user.id,
    });

    res.status(201).json({ status: "success", data: project });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

// Get All Projects With Tasks
exports.getProjectsWithTasks = async (req, res) => {
  try {
    const projects = await Project.find().lean();

    const projectsWithTasks = await Promise.all(
      projects.map(async (project) => {
        const tasks = await Task.find({ project: project._id })
          .populate("assignedTo", "name email")
          .populate("createdBy", "name email")
          .lean();

        return {
          ...project,
          tasks,
        };
      })
    );

    res.status(200).json({
      status: "success",
      results: projectsWithTasks.length,
      data: projectsWithTasks,
    });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

// Get All Projects
exports.getAllProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const query = search ? { name: { $regex: search, $options: "i" } } : {};

    const projects = await Project.find(query)
      .populate("createdBy", "name email")
      .populate("members", "name email")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const totalProjects = await Project.countDocuments(query);

    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const totalTasks = await Task.countDocuments({ project: project._id });
        const tasksCompleted = await Task.countDocuments({
          project: project._id,
          status: "completed",
        });

        return {
          ...project.toObject(),
          totalTasks,
          tasksCompleted,
          progress: totalTasks
            ? Math.round((tasksCompleted / totalTasks) * 100)
            : 0,
        };
      })
    );

    res.json({
      status: "success",
      totalProjects,
      totalPages: Math.ceil(totalProjects / limit),
      currentPage: Number(page),
      data: projectsWithStats,
    });
  } catch (error) {
    res.status(500).json({ status: "failed", message: error.message });
  }
};

//  Get Single Project By ID
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("members", "name email");

    if (!project)
      return res
        .status(404)
        .json({ status: "failed", message: "Project not found" });

    const totalTasks = await Task.countDocuments({ project: project._id });
    const tasksCompleted = await Task.countDocuments({
      project: project._id,
      status: "completed",
    });

    res.json({
      status: "success",
      data: {
        ...project.toObject(),
        totalTasks,
        tasksCompleted,
        progress: totalTasks
          ? Math.round((tasksCompleted / totalTasks) * 100)
          : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "failed", message: error.message });
  }
};

// Update Project ----------------------
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project)
      return res
        .status(404)
        .json({ status: "failed", message: "Project not found" });

    // Remove fields that should not be updated
    const { _id, createdBy, createdAt, updatedAt, __v, ...body } = req.body;

    // Validate only allowed fields
    const { error, value } = projectSchema.validate(body, {
      allowUnknown: false,
    });
    if (error)
      return res.status(400).json({
        status: "failed",
        message: error.details.map((d) => d.message),
      });

    // Check that all members exist
    const membersValid = await validateMembersExist(value.members);
    if (!membersValid)
      return res.status(400).json({
        status: "failed",
        message: "Some members do not exist",
      });

    // Update project
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      value,
      { new: true, runValidators: true }
    );

    res.status(200).json({ status: "success", data: updatedProject });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

//  Delete Project
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

    await Task.deleteMany({ projectId: project._id }).session(session);
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
