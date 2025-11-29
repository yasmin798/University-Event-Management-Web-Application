const Bazaar = require("../models/Bazaar");
const Trip = require("../models/Trips");
const Conference = require("../models/Conference");
const Workshop = require("../models/Workshop");
const GymSession = require("../models/GymSession");

// Returns overall total attendees and a per-event breakdown
exports.getAttendeesReport = async (req, res) => {
  try {
    // Allow admin or staff (event office) to fetch this report. Adjust here if you have a different role name.
    // Allow admin, staff, and the event office role (events_office)
    const allowed = ["admin", "events_office"];
    const role = req?.user?.role;
    // Log the authenticated user role for debugging access issues
    console.log("Attendees report requested by user:", {
      id: req?.user?._id,
      email: req?.user?.email,
      role,
    });

    if (!role || !allowed.includes(role)) {
      // Return the detected role in the response to help debugging (non-sensitive)
      return res.status(403).json({
        error: "Admin or events office access required",
        allowedRoles: allowed,
        detectedRole: role || null,
        userId: req?.user?._id || null,
      });
    }
    const breakdown = [];

    // Parse filters from query params
    const { eventType, eventName, startDate, endDate } = req.query || {};
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    // Note: Bazaars do not support registrations, so they are excluded from attendees report

    // 2) Trips
    if (!eventType || eventType === "trip") {
      const pipeline = [];
      const m = {};
      if (eventName) m.title = { $regex: eventName, $options: "i" };
      if (start || end) {
        const range = {};
        if (start) range.$gte = start;
        if (end) range.$lte = end;
        m.startDateTime = range;
      }
      if (Object.keys(m).length) pipeline.push({ $match: m });
      pipeline.push({
        $project: {
          title: 1,
          count: { $size: { $ifNull: ["$registrations", []] } },
        },
      });
      const trips = await Trip.aggregate(pipeline);
      trips.forEach((t) =>
        breakdown.push({
          eventType: "trip",
          id: t._id,
          title: t.title,
          count: t.count,
        })
      );
    }

    // Note: Conferences do not support registrations, so they are excluded from attendees report

    // 4) Workshops
    if (!eventType || eventType === "workshop") {
      const pipeline = [];
      const m = {};
      if (eventName) m.workshopName = { $regex: eventName, $options: "i" };
      if (start || end) {
        const range = {};
        if (start) range.$gte = start;
        if (end) range.$lte = end;
        m.startDateTime = range;
      }
      if (Object.keys(m).length) pipeline.push({ $match: m });
      pipeline.push({
        $project: {
          workshopName: 1,
          count: { $size: { $ifNull: ["$registrations", []] } },
        },
      });
      const workshops = await Workshop.aggregate(pipeline);
      workshops.forEach((w) =>
        breakdown.push({
          eventType: "workshop",
          id: w._id,
          title: w.workshopName,
          count: w.count,
        })
      );
    }

    // Note: Gym sessions do not support registrations, so they are excluded from attendees report

    const totalAttendees = breakdown.reduce(
      (sum, item) => sum + (item.count || 0),
      0
    );

    return res.json({ totalAttendees, breakdown });
  } catch (err) {
    console.error("Error building attendees report:", err);
    return res.status(500).json({ error: "Failed to build attendees report" });
  }
};
