// controllers/exportController.js or wherever you have export
const XLSX = require("xlsx");
const Workshop = require("../models/Workshop");
const Bazaar = require("../models/Bazaar");
const Trip = require("../models/Trip");

exports.exportAttendees = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // "workshops", "bazaars", "trips"

    let event;
    let attendees = [];

    if (type === "workshops") {
      event = await Workshop.findById(id).populate("registeredUsers", "firstName lastName email");
      if (!event) return res.status(404).json({ error: "Workshop not found" });

      if (!event.registeredUsers || event.registeredUsers.length === 0) {
        return res.status(404).json({ error: "No attendees found" });
      }

      attendees = event.registeredUsers.map(u => ({
        name: `${u.firstName} ${u.lastName}`.trim() || "—",
        email: u.email || "—",
      }));

    } else if (type === "bazaars") {
      event = await Bazaar.findById(id);
      if (!event) return res.status(404).json({ error: "Bazaar not found" });

      if (!event.registrations || event.registrations.length === 0) {
        return res.status(404).json({ error: "No attendees found" });
      }

      attendees = event.registrations.map(r => ({
        name: r.name || "—",
        email: r.email || "—",
      }));

    } else if (type === "trips") {
      event = await Trip.findById(id);
      if (!event) return res.status(404).json({ error: "Trip not found" });

      if (!event.registrations || event.registrations.length === 0) {
        return res.status(404).json({ error: "No attendees found" });
      }

      attendees = event.registrations.map(r => ({
        name: r.name || "—",
        email: r.email || "—",
      }));

    } else {
      return res.status(400).json({ error: "Invalid event type" });
    }

    // Create Excel
    const ws = XLSX.utils.json_to_sheet(attendees);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendees");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${event.title || "event"}_attendees.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ error: "Failed to export attendees" });
  }
};