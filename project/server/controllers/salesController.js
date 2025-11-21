const Bazaar = require("../models/Bazaar");
const Trip = require("../models/Trips");
const Conference = require("../models/Conference");
const Workshop = require("../models/Workshop");
const GymSession = require("../models/GymSession");

// Compute revenue per event and total revenue. Supports filters via query params.
exports.getSalesReport = async (req, res) => {
  try {
    const allowed = ["admin", "staff", "events_office"];
    const role = req?.user?.role;
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({
        error: "Admin or staff access required",
        detectedRole: role || null,
      });
    }

    const breakdown = [];
    const { eventType, eventName, startDate, endDate } = req.query || {};
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    // Helper to build match object
    const buildMatch = (titleField = "title", dateField = "startDateTime") => {
      const m = {};
      if (eventName) m[titleField] = { $regex: eventName, $options: "i" };
      if (start || end) {
        const range = {};
        if (start) range.$gte = start;
        if (end) range.$lte = end;
        m[dateField] = range;
      }
      return Object.keys(m).length ? m : null;
    };

    // Bazaars
    if (!eventType || eventType === "bazaar") {
      const pipeline = [];
      const m = buildMatch("title", "startDateTime");
      if (m) pipeline.push({ $match: m });
      pipeline.push({
        $project: {
          title: 1,
          price: { $ifNull: ["$price", 0] },
          attendees: { $size: { $ifNull: ["$registrations", []] } },
        },
      });
      const bazaars = await Bazaar.aggregate(pipeline);
      bazaars.forEach((b) =>
        breakdown.push({
          eventType: "bazaar",
          id: b._id,
          title: b.title,
          attendees: b.attendees || 0,
          price: b.price || 0,
          revenue: (b.price || 0) * (b.attendees || 0),
        })
      );
    }

    // Trips
    if (!eventType || eventType === "trip") {
      const pipeline = [];
      const m = buildMatch("title", "startDateTime");
      if (m) pipeline.push({ $match: m });
      pipeline.push({
        $project: {
          title: 1,
          price: { $ifNull: ["$price", 0] },
          attendees: {
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
          attendees: t.attendees || 0,
          price: t.price || 0,
          revenue: (t.price || 0) * (t.attendees || 0),
        })
      );
    }

    // Conferences
    if (!eventType || eventType === "conference") {
      const pipeline = [];
      const m = buildMatch("title", "startDateTime");
      if (m) pipeline.push({ $match: m });
      pipeline.push({
        $project: {
          title: 1,
          price: { $ifNull: ["$price", 0] },
          attendees: { $size: { $ifNull: ["$registrations", []] } },
        },
      });
      const conferences = await Conference.aggregate(pipeline);
      conferences.forEach((c) =>
        breakdown.push({
          eventType: "conference",
          id: c._id,
          title: c.title,
          attendees: c.attendees || 0,
          price: c.price || 0,
          revenue: (c.price || 0) * (c.attendees || 0),
        })
      );
    }

    // Workshops
    if (!eventType || eventType === "workshop") {
      const pipeline = [];
      const m = buildMatch("workshopName", "startDateTime");
      if (m) pipeline.push({ $match: m });
      pipeline.push({
        $project: {
          workshopName: 1,
          price: { $ifNull: ["$price", 0] },
          attendees: { $size: { $ifNull: ["$registeredUsers", []] } },
        },
      });
      const workshops = await Workshop.aggregate(pipeline);
      workshops.forEach((w) =>
        breakdown.push({
          eventType: "workshop",
          id: w._id,
          title: w.workshopName,
          attendees: w.attendees || 0,
          price: w.price || 0,
          revenue: (w.price || 0) * (w.attendees || 0),
        })
      );
    }

    // Gym sessions
    if (!eventType || eventType === "gymsession" || eventType === "gym") {
      const pipeline = [];
      const m = buildMatch("date", "date");
      if (m) pipeline.push({ $match: m });
      pipeline.push({
        $project: {
          date: 1,
          time: 1,
          price: { $ifNull: ["$price", 0] },
          attendees: { $size: { $ifNull: ["$registeredUsers", []] } },
        },
      });
      const gyms = await GymSession.aggregate(pipeline);
      gyms.forEach((g) =>
        breakdown.push({
          eventType: "gymsession",
          id: g._id,
          title: `${new Date(g.date).toLocaleDateString()} ${g.time}`,
          attendees: g.attendees || 0,
          price: g.price || 0,
          revenue: (g.price || 0) * (g.attendees || 0),
        })
      );
    }

    const totalRevenue = breakdown.reduce((s, it) => s + (it.revenue || 0), 0);
    // Apply sorting if requested
    const sort = (req.query && req.query.sort) || null; // expected: 'revenue_asc' or 'revenue_desc'
    if (sort === "revenue_asc") {
      breakdown.sort((a, b) => (a.revenue || 0) - (b.revenue || 0));
    } else if (sort === "revenue_desc") {
      breakdown.sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
    }

    return res.json({ totalRevenue, breakdown });
  } catch (err) {
    console.error("Error building sales report:", err);
    return res.status(500).json({ error: "Failed to build sales report" });
  }
};
