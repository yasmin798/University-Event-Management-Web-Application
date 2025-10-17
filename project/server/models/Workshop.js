const mongoose = require("mongoose");

const workshopSchema = new mongoose.Schema({
  type: { type: String, default: "workshop" },
  workshopName: { type: String, required: true },
  location: { type: String, required: true },
  startDateTime: { type: Date, required: true }, // Combine date/time
  endDateTime: { type: Date, required: true },
  shortDescription: { type: String, required: true },
  fullAgenda: { type: String, required: true },
  facultyResponsible: { type: String, required: true },
  professorsParticipating: { type: String, required: true },
  requiredBudget: { type: Number, required: true },
  fundingSource: { type: String, required: true },
  extraResources: { type: String },
  capacity: { type: Number, required: true },
  registrationDeadline: { type: Date, required: true },
  createdBy: { type: String },
  status: { type: String, default: "pending" },
  registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // For registration
  image: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Workshop", workshopSchema);
