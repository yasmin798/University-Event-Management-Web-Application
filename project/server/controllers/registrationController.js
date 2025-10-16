// controllers/registrationController.js
// assuming registered events are trips/workshops
const Trip = require("../models/Trips");
const Workshop = require("../models/Workshop");

// Helper to get model by event type
const getEventModel = (type) => {
  const models = {
    trip: Trip,
    workshop: Workshop,
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

    // Find the event and determine its type
    const eventFinders = [
      { model: Trip, type: "trip" },
      { model: Workshop, type: "workshop" },
    ];

    let event = null;
    let eventType = null;

    for (const finder of eventFinders) {
      const foundEvent = await finder.model.findById(eventId);
      if (foundEvent) {
        event = foundEvent;
        eventType = finder.type; // Store the type when the event is found
        break;
      }
    }

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check 2: Check capacity
    const isFull =
      event.capacity > 0 && event.registeredUsers.length >= event.capacity;
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
    const isAlreadyRegistered = event.registeredUsers.includes(userId);
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

    // Add user to the event and save
    event.registeredUsers.push(userId);
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
