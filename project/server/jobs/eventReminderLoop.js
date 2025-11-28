// server/jobs/eventReminderLoop.js
const mongoose = require("mongoose");

const Bazaar = require("../models/Bazaar");
const Trip = require("../models/Trips");
const Conference = require("../models/Conference");
const Workshop = require("../models/Workshop");
const Notification = require("../models/Notification");

const REMINDERS = [
  { name: "1d", ms: 24 * 60 * 60 * 1000, type: "event-reminder-1d" },
  { name: "1h", ms: 60 * 60 * 1000, type: "event-reminder-1h" },
];

// Build message text
function buildReminderMessage(eventType, event, offsetName) {
  // Map internal type → human label
  const labelMap = {
    bazaar: "bazaar",
    trip: "trip",
    conference: "conference",
    workshop: "workshop",
  };

  const label = labelMap[eventType] || "event";

  const title =
    event.title ||
    event.workshopName ||
    event.name ||
    "your upcoming event";

  const startTime = event.startDateTime.toLocaleString("en-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  if (offsetName === "1d") {
    // 1 day before
    return `The ${label} "${title}" that you registered for starts tomorrow at ${startTime}.`;
  }

  if (offsetName === "1h") {
    // 1 hour before
    return `The ${label} "${title}" that you registered for starts in 1 hour (${startTime}).`;
  }

  // Fallback (if you add other offsets later)
  return `The ${label} "${title}" that you registered for is coming up at ${startTime}.`;
}

function getRegisteredUserIdsForEvent(eventType, event) {
  if (eventType === "bazaar") {
    // Bazaar: registrations with userId (ObjectId or null)
    return (event.registrations || [])
      .map((r) => r.userId)
      .filter(Boolean);
  }

  if (eventType === "trip") {
    const fromRegisteredUsers = event.registeredUsers || [];
    const fromRegs = (event.registrations || [])
      .map((r) => r.userId)
      .filter(Boolean);

    return [...fromRegisteredUsers, ...fromRegs];
  }

  if (eventType === "conference") {
    return (event.registrations || [])
      .map((r) => r.userId)
      .filter(Boolean);
  }

  if (eventType === "workshop") {
    return event.registeredUsers || [];
  }

  return [];
}

async function createNotificationsForEventUsers(userIds, eventType, event, reminder) {
  const uniqueIds = [
    ...new Set(
      userIds
        .filter(Boolean)
        .map((id) => id.toString())
    ),
  ];

  for (const id of uniqueIds) {
    const userObjectId = new mongoose.Types.ObjectId(id);

    const query = {
      userId: userObjectId,
      type: reminder.type,
    };

    if (eventType === "bazaar") query.bazaarId = event._id;
    if (eventType === "trip") query.tripId = event._id;
    if (eventType === "conference") query.conferenceId = event._id;
    if (eventType === "workshop") query.workshopId = event._id;

    const exists = await Notification.exists(query);
    if (exists) continue;

    const message = buildReminderMessage(eventType, event, reminder.name);

    const notifData = {
      userId: userObjectId,
      message,
      type: reminder.type,
      unread: true,
    };

    if (eventType === "bazaar") notifData.bazaarId = event._id;
    if (eventType === "trip") notifData.tripId = event._id;
    if (eventType === "conference") notifData.conferenceId = event._id;
    if (eventType === "workshop") notifData.workshopId = event._id;

    await Notification.create(notifData);
  }
}

async function handleReminderWindow(reminder) {
  const now = new Date();
  const targetStart = new Date(now.getTime() + reminder.ms);
  const targetEnd = new Date(targetStart.getTime() + 60 * 1000); // 1-min window

  const windowQuery = {
    startDateTime: { $gte: targetStart, $lt: targetEnd },
  };

  // Bazaars
  const bazaars = await Bazaar.find({
    ...windowQuery,
    status: "published",
  });

  for (const b of bazaars) {
    const userIds = getRegisteredUserIdsForEvent("bazaar", b);
    await createNotificationsForEventUsers(userIds, "bazaar", b, reminder);
  }

  // Trips
  const trips = await Trip.find({
    ...windowQuery,
    status: "published",
  });

  for (const t of trips) {
    const userIds = getRegisteredUserIdsForEvent("trip", t);
    await createNotificationsForEventUsers(userIds, "trip", t, reminder);
  }

  // Conferences
  const conferences = await Conference.find({
    ...windowQuery,
    status: "published",
  });

  for (const c of conferences) {
    const userIds = getRegisteredUserIdsForEvent("conference", c);
    await createNotificationsForEventUsers(userIds, "conference", c, reminder);
  }

  // Workshops
  const workshops = await Workshop.find({
    ...windowQuery,
    status: "published",
  });

  for (const w of workshops) {
    const userIds = getRegisteredUserIdsForEvent("workshop", w);
    await createNotificationsForEventUsers(userIds, "workshop", w, reminder);
  }
}

let isRunning = false;

function startEventReminderLoop() {
  console.log("✅ Event reminder loop started (setInterval, no cron lib).");

  setInterval(async () => {
    if (isRunning) return; // avoid overlapping runs
    isRunning = true;

    try {
      console.log("⏰ Running event reminder loop...");
      for (const reminder of REMINDERS) {
        await handleReminderWindow(reminder);
      }
    } catch (err) {
      console.error("❌ Error in event reminder loop:", err);
    } finally {
      isRunning = false;
    }
  }, 60 * 1000); // every 1 minute
}

module.exports = { startEventReminderLoop };
