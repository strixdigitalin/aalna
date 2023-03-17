//  owner
const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  accountType: {
    type: String,
    default: "admin",
  },
});

mongoose.model("Admin", adminSchema);
