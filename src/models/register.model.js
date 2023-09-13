const mongoose = require("mongoose");

const RegisterSchema = new mongoose.Schema({
  run_id: { type: Number },
  sha: { type: String },
  repository_owner: { type: String },
  repository_name: { type: String },
  check_run_id: { type: Number },
  check_run_type: { type: String },
  branch: { type: String }
});

const Register = mongoose.model("Register", RegisterSchema, 'Register');

module.exports = Register;