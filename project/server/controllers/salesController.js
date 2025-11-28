const Bazaar = require("../models/Bazaar");
const BazaarApplication = require("../models/BazaarApplication");
const BoothApplication = require("../models/BoothApplication");
const Trip = require("../models/Trips");
const Workshop = require("../models/Workshop");

// Pricing tables (MUST MATCH paymentRoutes.js exactly)
const BAZAAR_PRICE_TABLE = {
  "Small (2x2)": 300,
  "Medium (3x3)": 600,
  "Large (4x4)": 1000,
  "Extra Large (5x5)": 1500,
  default: 500,
};

const BOOTH_PRICE_TABLE = {
  "Main Gate": 500,
  "Food Court": 400,
  "Central Area": 350,
  "Side Wing": 250,
  default: 300,
};

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

    // Bazaars - Revenue = sum of all paid booth applications for this bazaar
    if (!eventType || eventType === "bazaar") {
      const pipeline = [];
      const m = buildMatch("title", "startDateTime");
      if (m) pipeline.push({ $match: m });
      
      pipeline.push({
        $project: {
          title: 1,
          startDateTime: 1,
        },
      });
      
      const bazaars = await Bazaar.aggregate(pipeline);
      
      for (const bazaar of bazaars) {
        // Get all paid booth applications for this bazaar
        const paidBooths = await BazaarApplication.find({
          bazaar: bazaar._id,
          paid: true,
        });
        
        // Calculate TOTAL revenue from all booth payments
        const revenue = paidBooths.reduce((sum, booth) => {
          const price = BAZAAR_PRICE_TABLE[booth.boothSize] || BAZAAR_PRICE_TABLE.default;
          return sum + price;
        }, 0);
        
        breakdown.push({
          eventType: "bazaar",
          id: bazaar._id,
          title: bazaar.title,
          attendees: paidBooths.length,
          price: 0,
          revenue: revenue, // Total of all booth payments
        });
      }
    }

    // Platform Booths - Revenue = sum of all paid platform booth applications
    if (!eventType || eventType === "booth") {
      const matchQuery = { paid: true };
      
      if (start || end) {
        const range = {};
        if (start) range.$gte = start;
        if (end) range.$lte = end;
        matchQuery.createdAt = range;
      }
      
      const paidBooths = await BoothApplication.find(matchQuery);
      
      // Group by location and calculate total revenue
      const boothsByLocation = {};
      
      paidBooths.forEach((booth) => {
        const location = booth.platformSlot || booth.location || "default";
        const weeks = booth.durationWeeks || 1;
        const basePrice = BOOTH_PRICE_TABLE[location] || BOOTH_PRICE_TABLE.default;
        const revenue = basePrice * weeks;
        
        const key = `${location}-${weeks}`;
        if (!boothsByLocation[key]) {
          boothsByLocation[key] = {
            eventType: "booth",
            id: booth._id,
            title: `Platform Booth - ${location} (${weeks} week${weeks > 1 ? 's' : ''})`,
            attendees: 0,
            price: 0,
            revenue: 0,
          };
        }
        
        boothsByLocation[key].attendees += 1;
        boothsByLocation[key].revenue += revenue;
      });
      
      Object.values(boothsByLocation).forEach(b => breakdown.push(b));
    }

    // Trips - Revenue = price × number of PAID users
    if (!eventType || eventType === "trip") {
      const pipeline = [];
      const m = buildMatch("title", "startDateTime");
      if (m) pipeline.push({ $match: m });
      pipeline.push({
        $project: {
          title: 1,
          price: { $ifNull: ["$price", 0] },
          paidUsersCount: { $size: { $ifNull: ["$paidUsers", []] } },
        },
      });
      const trips = await Trip.aggregate(pipeline);
      trips.forEach((t) => {
        const revenue = (t.price || 0) * (t.paidUsersCount || 0);
        breakdown.push({
          eventType: "trip",
          id: t._id,
          title: t.title,
          attendees: t.paidUsersCount || 0,
          price: t.price || 0,
          revenue: revenue, // Total of all paid registrations
        });
      });
    }

    // Workshops - Revenue = calculated price × number of PAID users
    if (!eventType || eventType === "workshop") {
      const pipeline = [];
      const m = buildMatch("workshopName", "startDateTime");
      if (m) pipeline.push({ $match: m });
      pipeline.push({
        $project: {
          workshopName: 1,
          requiredBudget: 1,
          capacity: 1,
          paidUsersCount: { $size: { $ifNull: ["$paidUsers", []] } },
        },
      });
      const workshops = await Workshop.aggregate(pipeline);
      workshops.forEach((w) => {
        // Calculate price per person (matching payment logic)
        const budget = Number(w.requiredBudget || 0);
        const capacity = Number(w.capacity || 1);
        const pricePerPerson = capacity > 0 ? Math.round((budget / capacity) + 100) : 0;
        const paidCount = w.paidUsersCount || 0;
        const revenue = pricePerPerson * paidCount;
        
        breakdown.push({
          eventType: "workshop",
          id: w._id,
          title: w.workshopName,
          attendees: paidCount,
          price: pricePerPerson,
          revenue: revenue, // Total of all paid registrations
        });
      });
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
