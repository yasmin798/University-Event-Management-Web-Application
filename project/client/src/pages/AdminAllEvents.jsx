import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FixedSidebarAdmin from "../components/FixedSidebarAdmin";
import { Menu } from "lucide-react";

const API_ORIGIN = "http://localhost:3001";

export default function AdminAllEvents() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 10; // adjust to any number you want

  // ===== Filters =====
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [eventFilter, setEventFilter] = useState(""); // WORKSHOP / TRIP / ...
  const [sortOrder, setSortOrder] = useState("asc");

  // Debounced filters
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [debouncedDate, setDebouncedDate] = useState(dateFilter);

  // ===== Debounce logic =====
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedDate(dateFilter), 300);
    return () => clearTimeout(t);
  }, [dateFilter]);

  // ===== Fetch Events (no type param; filter type on frontend) =====
  async function fetchEvents() {
    setLoading(true);
    setMessage("");

    try {
      const params = new URLSearchParams();

      // unified search (title, prof, location handled on backend)
      if (debouncedSearch) params.append("search", debouncedSearch);

      if (debouncedDate) params.append("date", debouncedDate);

      params.append("sort", "startDateTime");
      params.append("order", sortOrder === "asc" ? "desc" : "asc");

      const res = await fetch(`${API_ORIGIN}/api/events/all?${params}`);
      const data = await res.json();

      let list = Array.isArray(data) ? data : data.events || [];

      // ✅ client-side type filter (WORKSHOP, BAZAAR, TRIP, CONFERENCE, BOOTH)
      if (eventFilter) {
        const targetType = eventFilter.toUpperCase();
        list = list.filter(
          (ev) => (ev.type || "").toUpperCase() === targetType
        );
      }

      setEvents(list);

      if (!list.length) {
        setMessage("⚠️ No events found with these filters.");
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setMessage("❌ Failed to load events.");
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchEvents();
  }, [debouncedSearch, debouncedDate, sortOrder, eventFilter]);

  if (loading) return <p style={{ textAlign: "center" }}>Loading events…</p>;
  const indexOfLast = currentPage * eventsPerPage;
  const indexOfFirst = indexOfLast - eventsPerPage;
  const currentEvents = events.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(events.length / eventsPerPage);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="flex h-screen bg-[#f5efeb]">
      <FixedSidebarAdmin />

      <div className="flex-1 overflow-auto" style={{ marginLeft: "260px" }}>
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-[#2f4156]">All Events</h1>
          </div>
        </header>

        <main className="p-4 md:p-8">
          {message && (
            <p
              style={{
                textAlign: "center",
                color: message.startsWith("⚠️") ? "#b45309" : "red",
                fontWeight: 500,
              }}
            >
              {message}
            </p>
          )}

          {/* ===== FILTER BAR ===== */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            {/* Search bar */}
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-300 shadow-sm w-full md:flex-[2]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="gray"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 3a7.5 7.5 0 006.15 13.65z"
                />
              </svg>

              <input
                type="text"
                placeholder="Search by title, professor, location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full outline-none bg-transparent text-sm"
              />
            </div>

            {/* Date picker */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-xl shadow-sm w-full md:flex-[1]"
            />

            {/* Event Type dropdown */}
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-xl shadow-sm w-full md:flex-[1] text-sm"
            >
              <option value="">All Types</option>
              <option value="WORKSHOP">Workshop</option>
              <option value="BAZAAR">Bazaar</option>
              <option value="TRIP">Trip</option>
              <option value="CONFERENCE">Conference</option>
              <option value="BOOTH">Booth</option>
            </select>

            {/* Sort button */}
            <button
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
              className="px-3 py-2 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-100 transition w-full md:w-auto text-sm"
            >
              Sort {sortOrder === "asc" ? "Oldest" : "Newest"}
            </button>
          </div>

          {/* ===== EVENTS TABLE ===== */}
          <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-[#8B5CF6] text-white">
                <th className="p-3">Type</th>
                <th className="p-3">Title</th>
                <th className="p-3">Location</th>
                <th className="p-3">Start</th>
                <th className="p-3">End</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {events.length ? (
                currentEvents.map((event) => (
                  <tr key={event._id} className="border-b">
                    <td className="p-3 text-center">
                      {(event.type || "").toUpperCase()}
                    </td>
                    <td className="p-3 text-center">
                      {event.title || event.name}
                    </td>
                    <td className="p-3 text-center">
                      {event.location || event.venue || "—"}
                    </td>
                    <td className="p-3 text-center">
                      {event.startDateTime
                        ? new Date(event.startDateTime).toLocaleString()
                        : "—"}
                    </td>
                    <td className="p-3 text-center">
                      {event.endDateTime
                        ? new Date(event.endDateTime).toLocaleString()
                        : "—"}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() =>
                          navigate(`/events/${event._id}`, {
                            state: { fromAdmin: true },
                          })
                        }
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-gray-500">
                    No events found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="flex justify-center items-center gap-4 mt-4">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50 hover:bg-gray-300 transition"
            >
              Prev
            </button>

            <div className="px-4 py-2 bg-gray-100 rounded font-semibold">
              {currentPage} / {totalPages}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50 hover:bg-gray-300 transition"
            >
              Next
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
