const mongoose = require("mongoose");

const workshopSchema = new mongoose.Schema({
  workshopName: { type: String, required: true },
  location: { type: String, required: true },
  startDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endDate: { type: Date, required: true },
  endTime: { type: String, required: true },
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
  image: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Workshop", workshopSchema);
