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
    const userId = req.user.id;
    const { type } = req.body; // Frontend must send event type (e.g., "workshop")

    if (!type) return res.status(400).json({ error: "Event type required" });

    const Model = getEventModel(type);
    if (!Model) return res.status(400).json({ error: "Invalid event type" });

    const event = await Model.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Checks
    if (event.registeredUsers.length >= event.capacity) return res.status(400).json({ error: "Capacity full" });
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) return res.status(400).json({ error: "Registration deadline passed" });
    if (event.registeredUsers.includes(userId)) return res.status(400).json({ error: "Already registered" });

    event.registeredUsers.push(userId);
    await event.save();

    res.json({ message: "Registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};