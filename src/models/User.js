const mongoose = require("mongoose");

const userSchema = new mongoose.userSchema(
  {
    name: { type: String, require: true },
    email: { type: String, require: true },
    passowrd: { type: string, require: true },
    role: { type: string, enum: ["Admin", "User"], default: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
