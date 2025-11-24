// controllers/registrationController.js
// assuming registered events are trips/workshops/conferences/bazaars/booths
const Trip = require("../models/Trips");
const Workshop = require("../models/Workshop");
const Conference = require("../models/Conference");
const Bazaar = require("../models/Bazaar");
const BoothApplication = require("../models/BoothApplication");
const User = require("../models/User"); // Needed for name/email

// Helper to get model by event type
const getEventModel = (type) => {
  const models = {
    trip: Trip,
    workshop: Workshop,
    conference: Conference,
    bazaar: Bazaar,
    booth: BoothApplication,
  };
  return models[type.toLowerCase()];
};

// Register for event (with capacity check)
exports.register = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id; // from protect middleware

    // Check 1: Ensure user is not blocked
    if (req.user.status === "blocked") {
      return res
        .status(403)
        .json({ error: "User is blocked and cannot register" });
    }

    // Updated: Find the event across all models and determine its type
    let event;
    let eventType;

    // Try Conference first (since your model supports registrations)
    event = await Conference.findById(eventId);
    if (event) {
      eventType = "conference";
    } else {
      // Try Trip
      event = await Trip.findById(eventId);
      if (event) {
        eventType = "trip";
      } else {
        // Try Workshop
        event = await Workshop.findById(eventId);
        if (event) {
          eventType = "workshop";
        } else {
          // Try Bazaar (if it supports registrations)
          event = await Bazaar.findById(eventId);
          if (event) {
            eventType = "bazaar";
          } else {
            // Try BoothApplication (if booths support attendee registration)
            event = await BoothApplication.findById(eventId);
            if (event) {
              eventType = "booth";
            }
          }
        }
      }
    }

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Fetch user for name/email
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userEmail = user.email;
    const userName =
      `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Guest";

    // Check 5: Role restriction (if defined)
    if (event.allowedRoles && event.allowedRoles.length > 0) {
      const allowedLower = event.allowedRoles.map((r) =>
        String(r).toLowerCase().trim()
      );
      const userRoleLower = String(req.user.role || "")
        .toLowerCase()
        .trim();
      if (
        !allowedLower.includes(userRoleLower) &&
        userRoleLower !== "events_office"
      ) {
        const allowed = event.allowedRoles
          .map(
            (r) => String(r).charAt(0).toUpperCase() + String(r).slice(1) + "s"
          )
          .join(", ");
        return res
          .status(403)
          .json({ error: `This event is intended for ${allowed}!` });
      }
    }

    // Check 2: Check capacity
    const currentCount = event.registrations ? event.registrations.length : 0;
    const isFull = event.capacity > 0 && currentCount >= event.capacity;
    if (isFull) {
      return res.status(400).json({ error: "Event is at full capacity" });
    }

    // Check 3: Check registration deadline
    const hasDeadlinePassed =
      event.registrationDeadline &&
      new Date() > new Date(event.registrationDeadline);
    if (hasDeadlinePassed) {
      return res
        .status(400)
        .json({ error: "Registration deadline has passed" });
    }

    // Check 4: Check if user is already registered
    const isAlreadyRegistered = event.registeredUsers
      ? event.registeredUsers.includes(userId)
      : false;
    if (isAlreadyRegistered) {
      return res
        .status(400)
        .json({ error: "Already registered for this event" });
    }

    // ✅ FIX: If the document is missing the 'type' field, add it before saving.
    if (!event.type && eventType) {
      console.log(
        `Patching event ${event._id} with missing type: '${eventType}'`
      );
      event.type = eventType;
    }

    // Safeguard: Ensure arrays exist
    if (!event.registeredUsers) event.registeredUsers = [];
    if (!event.registrations) event.registrations = [];

    // Add user to the event and save
    event.registeredUsers.push(userId);
    await event.save();
    // Push to `registrations` (with name/email)
    event.registrations.push({
      userId: userId.toString(),
      name: userName,
      email: userEmail,
      registeredAt: new Date(),
    });
    // Also keep `registeredUsers` for backward compatibility
    if (!event.registeredUsers.includes(userId)) {
      event.registeredUsers.push(userId);
    }

    await event.save();

    res.status(200).json({ message: "Registered successfully" });
  } catch (err) {
    // Catch any errors during the process (like validation errors)
    console.error("Registration Error:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: "Server error during registration" });
  }
};

// Optional: Add a function to unregister if needed
exports.unregister = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    // Find the event across all models (similar logic as register)
    let event;
    let eventType;

    event = await Conference.findById(eventId);
    if (event) {
      eventType = "conference";
    } else {
      event = await Trip.findById(eventId);
      if (event) {
        eventType = "trip";
      } else {
        event = await Workshop.findById(eventId);
        if (event) {
          eventType = "workshop";
        } else {
          event = await Bazaar.findById(eventId);
          if (event) {
            eventType = "bazaar";
          } else {
            event = await BoothApplication.findById(eventId);
            if (event) {
              eventType = "booth";
            }
          }
        }
      }
    }

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if user is registered
    const isRegistered = event.registeredUsers
      ? event.registeredUsers.includes(userId)
      : false;
    if (!isRegistered) {
      return res.status(400).json({ error: "Not registered for this event" });
    }

    // Remove from registeredUsers
    event.registeredUsers = event.registeredUsers.filter(
      (id) => id.toString() !== userId.toString()
    );

    // Remove from registrations
    event.registrations = event.registrations.filter(
      (r) => r.userId !== userId.toString()
    );

    await event.save();

    res.status(200).json({ message: "Unregistered successfully" });
  } catch (err) {
    console.error("Unregistration Error:", err);
    return res
      .status(500)
      .json({ error: "Server error during unregistration" });
  }
};
