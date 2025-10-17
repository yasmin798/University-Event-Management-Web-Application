const BASE_URL = "http://localhost:3000/api";

export const eventAPI = {
  getAllEvents: async () => {
    const res = await fetch(`${BASE_URL}/events/all`);
    if (!res.ok) throw new Error("Failed to fetch events");
    return res.json();
  },
  getEventById: async (id) => {
    const res = await fetch(`${BASE_URL}/events/${id}`);
    if (!res.ok) throw new Error("Failed to fetch event");
    return res.json();
  },
};
