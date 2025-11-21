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
    const allowed = ["admin", "staff", "events_office"];
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
        error: "Admin or staff access required",
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

    // 1) Bazaars
    if (!eventType || eventType === "bazaar") {
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
      const bazaars = await Bazaar.aggregate(pipeline);
      bazaars.forEach((b) =>
        breakdown.push({
          eventType: "bazaar",
          id: b._id,
          title: b.title,
          count: b.count,
        })
      );
    }

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
          count: {
            $add: [
              { $size: { $ifNull: ["$registrations", []] } },
              { $size: { $ifNull: ["$registeredUsers", []] } },
            ],
          },
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

    // 3) Conferences
    if (!eventType || eventType === "conference") {
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
      const conferences = await Conference.aggregate(pipeline);
      conferences.forEach((c) =>
        breakdown.push({
          eventType: "conference",
          id: c._id,
          title: c.title,
          count: c.count,
        })
      );
    }

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
          count: { $size: { $ifNull: ["$registeredUsers", []] } },
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

    // 5) Gym sessions
    if (!eventType || eventType === "gymsession" || eventType === "gym") {
      const pipeline = [];
      const m = {};
      if (start || end) {
        const range = {};
        if (start) range.$gte = start;
        if (end) range.$lte = end;
        m.date = range;
      }
      if (Object.keys(m).length) pipeline.push({ $match: m });
      pipeline.push({
        $project: {
          date: 1,
          time: 1,
          count: { $size: { $ifNull: ["$registeredUsers", []] } },
        },
      });
      const gyms = await GymSession.aggregate(pipeline);
      gyms.forEach((g) =>
        breakdown.push({
          eventType: "gymsession",
          id: g._id,
          title: `${new Date(g.date).toLocaleDateString()} ${g.time}`,
          count: g.count,
        })
      );
    }

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
