const express = require("express");
const router = express.Router();
const ExcelJS = require("exceljs");
const nodemailer = require("nodemailer");

// Models
const Bazaar = require("../models/Bazaar");
const Trip = require("../models/Trips");
const Conference = require("../models/Conference");
const Workshop = require("../models/Workshop");
const BoothApplication = require("../models/BoothApplication");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Controllers
const { register } = require("../controllers/registrationController");
const boothController = require("../controllers/boothController");

// Middleware
const { protect, adminOnly } = require("../middleware/auth");

// Helper: normalize title
const normTitle = (b = {}) => b.title || b.name || "";

/* ==================== ARCHIVE ANY EVENT ==================== */
router.patch("/:type/:id", protect, async (req, res) => {
  try {
    // Only events_office can archive
    if (!req.user || req.user.role !== "events_office") {
      return res.status(403).json({ error: "events_office access required" });
    }

    const { type, id } = req.params;
    const { status } = req.body;

    if (status !== "archived") {
      return res.status(400).json({ error: "Status must be 'archived'" });
    }

    const validTypes = [
      "bazaars",
      "trips",
      "conferences",
      "workshops",
      "booths",
    ];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid event type" });
    }

    const modelMap = {
      bazaars: Bazaar,
      trips: Trip,
      conferences: Conference,
      workshops: Workshop,
      booths: BoothApplication,
    };
    const Model = modelMap[type];

    const updated = await Model.findByIdAndUpdate(
      id,
      {
        status: "archived",
        archivedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Event not found" });
    }

    return res.json({ message: "Event archived successfully", event: updated });
  } catch (err) {
    console.error("Archive error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* ------------------- BAZAARS ------------------- */
router.get("/bazaars", async (req, res) => {
  try {
    const items = await Bazaar.find().sort({ startDateTime: 1 });
    res.json({ items, total: items.length, page: 1, pages: 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/bazaars/:id", async (req, res) => {
  try {
    const doc = await Bazaar.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/bazaars", async (req, res) => {
  try {
    const b = req.body || {};
    const title = normTitle(b);
    if (!title) return res.status(400).json({ error: "title is required" });
    if (!b.location)
      return res.status(400).json({ error: "location is required" });
    if (!b.startDateTime || !b.endDateTime)
      return res
        .status(400)
        .json({ error: "startDateTime and endDateTime are required" });

    // 1. Create bazaar document
    const bazaar = await Bazaar.create({
      type: "bazaar",
      title,
      location: b.location,
      shortDescription: b.shortDescription || "",
      startDateTime: new Date(b.startDateTime),
      endDateTime: new Date(b.endDateTime),
      registrationDeadline: b.registrationDeadline
        ? new Date(b.registrationDeadline)
        : undefined,
      price: b.price != null ? Number(b.price) : 0,
      capacity: b.capacity != null ? Number(b.capacity) : 0,
      status: "published",
    });

    // 2. Fetch all users
    const users = await User.find({}, "_id");

    // 3. Create notifications for all users
    const notifications = users.map((u) => ({
      userId: u._id,
      message: `A new bazaar was created: ${title}`,
      type: "bazaar",
      bazaarId: bazaar._id, // optional, you can rename to eventId later
    }));

    await Notification.insertMany(notifications);

    res.status(201).json(bazaar);
  } catch (e) {
    console.error("Create bazaar error:", e);
    res.status(400).json({ error: e.message });
  }
});

router.put("/bazaars/:id", async (req, res) => {
  try {
    const b = req.body || {};
    const updates = {
      ...(b.title || b.name ? { title: b.title || b.name } : {}),
      ...(b.location ? { location: b.location } : {}),
      ...(b.shortDescription !== undefined
        ? { shortDescription: b.shortDescription }
        : {}),
      ...(b.startDateTime ? { startDateTime: new Date(b.startDateTime) } : {}),
      ...(b.endDateTime ? { endDateTime: new Date(b.endDateTime) } : {}),
      ...(b.registrationDeadline
        ? { registrationDeadline: new Date(b.registrationDeadline) }
        : {}),
      ...(b.price != null ? { price: Number(b.price) } : {}),
      ...(b.capacity != null ? { capacity: Number(b.capacity) } : {}),
    };
    const doc = await Bazaar.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/bazaars/:id", async (req, res) => {
  try {
    const bazaar = await Bazaar.findById(req.params.id);
    if (!bazaar) return res.status(404).json({ error: "Bazaar not found" });
    if (
      Array.isArray(bazaar.registrations) &&
      bazaar.registrations.length > 0
    ) {
      return res
        .status(403)
        .json({ error: "Cannot delete: participants registered" });
    }
    await Bazaar.findByIdAndDelete(req.params.id);
    res.json({ ok: true, message: "Bazaar deleted successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ------------------- TRIPS ------------------- */
router.get("/trips", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit || "50", 10))
    );
    const [items, total] = await Promise.all([
      Trip.find()
        .sort({ startDateTime: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Trip.countDocuments(),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/trips/:id", async (req, res) => {
  try {
    const doc = await Trip.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Trip not found" });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/trips", async (req, res) => {
  try {
    const {
      title,
      location,
      shortDescription,
      startDateTime,
      endDateTime,
      registrationDeadline,
      price,
      capacity,
      allowedRoles = [],
    } = req.body;

    // 1. Create trip
    const trip = new Trip({
      title,
      location,
      shortDescription,
      startDateTime,
      endDateTime,
      registrationDeadline,
      price: price || 0,
      capacity: capacity || 0,
      allowedRoles,
      registeredUsers: [],
      registrations: [],
    });

    await trip.save();

    // 2. Create notification for ALL users (temporary test)
    const users = await User.find({}, "_id"); // get all user IDs

    const notifications = users.map((u) => ({
      userId: u._id,
      message: `A new trip was created: ${title}`,
      type: "trip",
      tripId: trip._id, // optional, you can rename to eventId later
    }));

    await Notification.insertMany(notifications);

    res.status(201).json(trip);
  } catch (err) {
    console.error("Create trip error:", err);
    res.status(400).json({ error: err.message });
  }
});

/* ------------------- UPDATE TRIP (MISSING BEFORE) ------------------- */
router.put("/trips/:id", async (req, res) => {
  try {
    const {
      title,
      location,
      shortDescription,
      startDateTime,
      endDateTime,
      registrationDeadline,
      price,
      capacity,
      allowedRoles = [], // ← This now gets saved when editing!
    } = req.body;

    const updatedTrip = await Trip.findByIdAndUpdate(
      req.params.id,
      {
        title,
        location,
        shortDescription,
        startDateTime,
        endDateTime,
        registrationDeadline,
        price: price || 0,
        capacity: capacity || 0,
        allowedRoles, // ← Critical: saves your checkbox selections
      },
      { new: true, runValidators: true }
    );

    if (!updatedTrip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    res.json(updatedTrip);
  } catch (err) {
    console.error("Update trip error:", err);
    res.status(400).json({ error: err.message });
  }
});

router.delete("/trips/:id", async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    if (Array.isArray(trip.registrations) && trip.registrations.length > 0) {
      return res
        .status(403)
        .json({ error: "Cannot delete: participants registered" });
    }
    await Trip.findByIdAndDelete(req.params.id);
    res.json({ ok: true, message: "Trip deleted successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ------------------- CONFERENCES ------------------- */
router.get("/conferences", async (req, res) => {
  try {
    const items = await Conference.find().sort({ startDateTime: 1 });
    res.json({ items, total: items.length, page: 1, pages: 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/conferences/:id", async (req, res) => {
  try {
    const doc = await Conference.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/conferences", async (req, res) => {
  try {
    const {
      title,
      name,
      shortDescription,
      startDateTime,
      endDateTime,
      fullAgenda,
      website,
      requiredBudget,
      fundingSource,
      extraResources,
      allowedRoles = [],
    } = req.body;

    // 1. Create Conference
    const conference = new Conference({
      title: title || name,
      name: name || title,
      shortDescription,
      startDateTime,
      endDateTime,
      fullAgenda,
      website,
      requiredBudget,
      fundingSource,
      extraResources,
      allowedRoles,
      registrations: [],
    });

    await conference.save();

    // 2. Fetch all users
    const users = await User.find({}, "_id");

    // 3. Create notifications (one per user)
    const notifications = users.map((u) => ({
      userId: u._id,
      message: `A new conference was created: ${conference.title}`,
      type: "conference",
      conferenceId: conference._id, // use this on frontend later
    }));

    // 4. Insert all notifications at once
    await Notification.insertMany(notifications);

    // 5. Return response
    res.status(201).json(conference);
  } catch (err) {
    console.error("Create conference error:", err);
    res.status(400).json({ error: err.message });
  }
});

router.put("/conferences/:id", async (req, res) => {
  try {
    const {
      title,
      name,
      shortDescription,
      startDateTime,
      endDateTime,
      fullAgenda,
      website,
      requiredBudget,
      fundingSource,
      extraResources,
      allowedRoles = [],
    } = req.body;

    const updated = await Conference.findByIdAndUpdate(
      req.params.id,
      {
        title: title || name,
        name: name || title,
        shortDescription,
        startDateTime,
        endDateTime,
        fullAgenda,
        website,
        requiredBudget,
        fundingSource,
        extraResources,
        allowedRoles,
      },
      { new: true, runValidators: true }
    );

    if (!updated)
      return res.status(404).json({ error: "Conference not found" });
    res.json(updated);
  } catch (err) {
    console.error("Update conference error:", err);
    res.status(400).json({ error: err.message });
  }
});

router.delete("/conferences/:id", async (req, res) => {
  try {
    const conference = await Conference.findById(req.params.id);
    if (!conference) return res.status(404).json({ error: "Not found" });
    if (conference.registrations?.length > 0) {
      return res
        .status(403)
        .json({ error: "Cannot delete: participants registered" });
    }
    await Conference.findByIdAndDelete(req.params.id);
    res.json({ ok: true, message: "Conference deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
/* ------------------- BOOTHS ------------------- */
router.delete("/booths/:id", boothController.deleteBooth);

/* ------------------- REGISTRATION ------------------- */
router.post("/events/:eventId/register", protect, register);

/* ------------------- UNIFIED EVENT LIST (FILTER + SORT) ------------------- */
router.get("/all", async (req, res) => {
  try {
    const {
      search,
      type,
      location,
      date,
      sort = "startDateTime",
      order = "asc",
    } = req.query;

    const query = {};

    // Don't add a `type` field to the Mongo query because individual
    // models (Workshop, Bazaar, Trip, Conference, BoothApplication)
    // don't store a `type` field. Instead use `type` to decide which
    // models to query.
    const typeUpper = type ? type.toUpperCase() : null;
    if (location) query.location = new RegExp(location, "i");

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { title: regex },
        { name: regex },
        { workshopName: regex },
        { professorsParticipating: regex },
        { description: regex },
        { shortDescription: regex },
      ];
    }

    if (date) {
      const day = new Date(date);
      const next = new Date(day);
      next.setDate(day.getDate() + 1);
      query.startDateTime = { $gte: day, $lt: next };
    }

    // Decide which models to fetch based on `type` parameter.
    const fetchWorkshops = !typeUpper || typeUpper === "WORKSHOP";
    const fetchBazaars = !typeUpper || typeUpper === "BAZAAR";
    const fetchTrips = !typeUpper || typeUpper === "TRIP";
    const fetchConferences = !typeUpper || typeUpper === "CONFERENCE";
    const fetchBooths = !typeUpper || typeUpper === "BOOTH";

    const [workshops, bazaars, trips, conferences, booths] = await Promise.all([
      fetchWorkshops ? Workshop.find(query).lean() : [],
      fetchBazaars ? Bazaar.find(query).lean() : [],
      fetchTrips ? Trip.find(query).lean() : [],
      fetchConferences ? Conference.find(query).lean() : [],
      fetchBooths
        ? BoothApplication.find({ ...query, status: "accepted" }).lean()
        : [],
    ]);

    const normalize = (doc, type) => ({
      ...doc,
      _id: doc._id.toString(),
      type,
      title: doc.title || doc.name || doc.workshopName || "Untitled",
      professorsParticipating: doc.professorsParticipating || "",
      location: doc.location || "",
      startDateTime: doc.startDateTime || doc.startDate || doc.date,
      endDateTime: doc.endDateTime || doc.startDateTime,
      image: doc.image || "",
    });

    let allEvents = [
      ...workshops.map((w) => normalize(w, "WORKSHOP")),
      ...bazaars.map((b) => normalize(b, "BAZAAR")),
      ...trips.map((t) => normalize(t, "TRIP")),
      ...conferences.map((c) => normalize(c, "CONFERENCE")),
      ...booths.map((b) =>
        normalize(
          {
            ...b,
            title: b.bazaar?.title || b.title || "Booth",
            startDateTime: b.bazaar?.startDateTime || b.startDateTime,
            endDateTime: b.bazaar?.endDateTime || b.endDateTime,
          },
          "BOOTH"
        )
      ),
    ];

    // Sort
    const dir = order === "desc" ? -1 : 1;
    allEvents.sort((a, b) => {
      const A = new Date(a.startDateTime);
      const B = new Date(b.startDateTime);
      return (A > B ? 1 : -1) * dir;
    });

    res.json(allEvents);
  } catch (err) {
    console.error("GET /all error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------- EXPORT ATTENDEES AS XLSX (FIXED) ------------------- */
router.get("/events/:id/registrations", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { format } = req.query;

    // Try to find event in any model
    let event = null;
    let attendees = [];
    let eventType = null;

    // 1. Try Workshop (has registeredUsers as User refs)
    event = await Workshop.findById(id).populate(
      "registeredUsers",
      "firstName lastName email"
    );
    if (event) {
      eventType = "workshop";
      attendees = (event.registeredUsers || []).map((u) => ({
        name:
          `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unknown User",
        email: u.email || "—",
      }));
    }

    // 2. Try Bazaar (has registrations array of objects)
    if (!attendees.length) {
      event = await Bazaar.findById(id).populate(
        "registrations.userId",
        "firstName lastName email"
      );
      if (event && event.registrations) {
        eventType = "bazaar";
        attendees = event.registrations.map((r) => {
          // If userId is populated, use the user's name
          if (r.userId && typeof r.userId === "object" && r.userId.firstName) {
            return {
              name: `${r.userId.firstName} ${r.userId.lastName}`,
              email: r.userId.email || r.email || "—",
            };
          }
          // Otherwise use the registration's name/email
          return {
            name: r.name || "Guest",
            email: r.email || "—",
          };
        });
      }
    }

    // 3. Try Trip (has both registeredUsers and registrations array)
    if (!attendees.length) {
      event = await Trip.findById(id).populate(
        "registeredUsers",
        "firstName lastName email"
      );
      if (event) {
        eventType = "trip";
        // First, add registered users (logged-in users)
        if (event.registeredUsers && event.registeredUsers.length > 0) {
          attendees = event.registeredUsers.map((u) => ({
            name: `${u.firstName} ${u.lastName}`,
            email: u.email,
          }));
        }
        // Then, add guest registrations
        if (event.registrations && event.registrations.length > 0) {
          const guestAttendees = event.registrations.map((r) => ({
            name: r.name || "Guest",
            email: r.email || "—",
          }));
          attendees = [...attendees, ...guestAttendees];
        }
      }
    }

    // 4. Try Booth (has registrations array for visitors)
    if (!attendees.length) {
      event = await BoothApplication.findById(id).populate(
        "registrations.userId",
        "firstName lastName email"
      );
      if (event && event.registrations) {
        eventType = "booth";
        attendees = event.registrations.map((r) => {
          // If userId is populated, use the user's name
          if (r.userId && typeof r.userId === "object" && r.userId.firstName) {
            return {
              name: `${r.userId.firstName} ${r.userId.lastName}`,
              email: r.userId.email || r.email || "—",
            };
          }
          // Otherwise use the registration's name/email
          return {
            name: r.name || "Guest",
            email: r.email || "—",
          };
        });
      }
    }

    // 5. Check if it's a Conference (should be blocked)
    if (!event) {
      const conferenceEvent = await Conference.findById(id);
      if (conferenceEvent) {
        return res
          .status(403)
          .json({ error: "Conferences cannot be exported" });
      }
    }

    if (!event || attendees.length === 0) {
      return res.status(404).json({ error: "No attendees found" });
    }

    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Attendees");
      sheet.columns = [
        { header: "Name", key: "name", width: 30 },
        { header: "Email", key: "email", width: 35 },
      ];
      attendees.forEach((att) => sheet.addRow(att));

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=attendees_${id}.xlsx`
      );
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.json(attendees);
    }
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ error: "Export failed" });
  }
});

/* ------------------- GET SINGLE EVENT BY ID (UNIFIED) ------------------- */
router.get("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    if (!id || !type)
      return res.status(400).json({ error: "Missing id or type" });

    let event;
    if (type === "workshop") event = await Workshop.findById(id);
    else if (type === "bazaar") event = await Bazaar.findById(id);
    else if (type === "trip") event = await Trip.findById(id);
    else if (type === "conference") event = await Conference.findById(id);
    else if (type === "booth") {
      event = await BoothApplication.findById(id).populate({
        path: "bazaar",
        select: "title startDateTime endDateTime",
      });
    } else return res.status(400).json({ error: "Invalid event type" });

    if (type === "booth" && event) {
      event = {
        ...event.toObject(),
        type: "Booth",
        title: event.bazaar?.title || event.bazaar?.name || "Booth",
        name: event.bazaar?.title || event.bazaar?.name || "Booth",
        startDateTime: event.bazaar?.startDateTime,
        endDateTime: event.bazaar?.endDateTime,
        description: event.description || event.shortDescription || "",
      };
    }

    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

/* ------------------- SEND VENDOR NOTIFICATION ------------------- */
router.post("/admin/send-vendor-notification", async (req, res) => {
  try {
    const { email, requestId, status, type, details } = req.body;

    // Validate input
    if (!email || !status || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Set up Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // eventitynotifications@gmail.com
        pass: process.env.EMAIL_PASS, // App Password
      },
    });

    // Email content
    const isAccepted = status === "accepted";
    const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1);
    let detailsString = Object.entries(details)
      .map(
        ([key, value]) =>
          `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`
      )
      .join("\n");

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Your ${typeCapitalized} Vendor Request Has Been ${
        isAccepted ? "Accepted" : "Rejected"
      }`,
      text: `
        Dear Vendor,

        Your ${type} vendor request (ID: ${requestId}) has been ${status}.

        Details:
        ${detailsString}

        ${
          isAccepted
            ? "We look forward to your participation!"
            : "If you have any questions, please contact support."
        }

        — Admin Team
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({ message: "Notification sent successfully" });
  } catch (error) {
    console.error("Error sending vendor notification:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

module.exports = router;
