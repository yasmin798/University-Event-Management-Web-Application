import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Menu, User, LogOut } from "lucide-react";
import NotificationsDropdown from "../components/NotificationsDropdown";
import workshopPlaceholder from "../images/workshop.png";
import EventTypeDropdown from "../components/EventTypeDropdown";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [allEvents, setAllEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [professorFilter, setProfessorFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Debounced search to avoid filtering on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [debouncedProfessor, setDebouncedProfessor] = useState(professorFilter);
  const [debouncedLocation, setDebouncedLocation] = useState(locationFilter);
  const [debouncedDate, setDebouncedDate] = useState(dateFilter);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedProfessor(professorFilter), 300);
    return () => clearTimeout(t);
  }, [professorFilter]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedLocation(locationFilter), 300);
    return () => clearTimeout(t);
  }, [locationFilter]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedDate(dateFilter), 300);
    return () => clearTimeout(t);
  }, [dateFilter]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const params = new URLSearchParams();

        // Combine search and professor filter into search param
        const searchParts = [];
        if (debouncedSearch) searchParts.push(debouncedSearch);
        if (debouncedProfessor) searchParts.push(debouncedProfessor);
        if (searchParts.length > 0) {
          params.append("search", searchParts.join(" "));
        }

        if (debouncedLocation) params.append("location", debouncedLocation);
        if (eventTypeFilter !== "All") {
          params.append("type", eventTypeFilter.toUpperCase());
        }
        if (debouncedDate) params.append("date", debouncedDate);
        params.append("sort", "startDateTime");
        params.append("order", sortOrder);

        const response = await fetch(
          `http://localhost:3001/api/events/all?${params.toString()}`
        );
        const data = await response.json();
        setAllEvents(Array.isArray(data) ? data : data.events || []);
      } catch (error) {
        console.error("Error fetching events:", error);
        setAllEvents([]);
      }
    };
    fetchEvents();
  }, [
    debouncedSearch,
    debouncedProfessor,
    debouncedLocation,
    eventTypeFilter,
    debouncedDate,
    sortOrder,
  ]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) navigate("/");
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Server already filtered events based on debounced params
  const filteredEvents = allEvents;

  return (
    <div className="flex h-screen bg-[#f5efeb]">
      {/* Overlay for sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#2f4156] text-white flex flex-col transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#567c8d] rounded-full"></div>
            <span className="text-xl font-bold">EventHub</span>
          </div>
        </div>

        <div className="flex-1 px-4 mt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-[#c88585] hover:bg-[#b87575] text-white py-3 px-4 rounded-lg transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Top navigation */}
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4 flex items-center justify-between">
          {/* Menu toggle */}

          {/* Search + filter */}
          <div className="relative flex-1 max-w-3xl flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[320px]">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#567c8d]"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by name or professor or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#c8d9e6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#567c8d]"
              />
            </div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-[#c8d9e6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#567c8d]"
            />
            <EventTypeDropdown
              selected={eventTypeFilter}
              onChange={setEventTypeFilter}
            />
            <button
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
              className="px-3 py-2 border border-[#c8d9e6] bg-white rounded-lg hover:bg-[#f5efeb] transition-colors"
            >
              Sort {sortOrder === "asc" ? "Oldest" : "Newest"} First
            </button>
          </div>

          {/* Notification bell & user */}
          <div className="flex items-center gap-2 md:gap-4 ml-4">
            <div>
              <NotificationsDropdown />
            </div>
            <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center">
              <User size={20} className="text-[#2f4156]" />
            </div>
          </div>
        </header>

        {/* Events grid */}
        <main className="p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#2f4156] mb-6">
            Available Events
          </h1>

          {/* Filtered events grid */}
          {filteredEvents.length === 0 ? (
            <p className="text-[#567c8d]">No events found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <div
                  key={event._id}
                  className="bg-[#fdfdfd] border border-[#c8d9e6] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="h-40 w-full bg-gray-200">
                    <img
                      src={event.image || workshopPlaceholder}
                      alt={event.title || event.name || event.workshopName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="text-xs font-semibold text-[#567c8d] mb-1">
                      {event.type?.toUpperCase() || "EVENT"}
                    </div>
                    <h3 className="font-semibold text-lg text-[#2f4156] truncate">
                      {event.title ||
                        event.name ||
                        event.workshopName ||
                        "Untitled"}
                    </h3>
                    {event.professorsParticipating && (
                      <p className="text-sm text-[#567c8d] truncate">
                        Professors: {event.professorsParticipating}
                      </p>
                    )}
                    <p className="text-sm text-[#567c8d] truncate">
                      Location: {event.location || event.venue || "N/A"}
                    </p>
                    <p className="text-sm text-[#567c8d] truncate">
                      Date:{" "}
                      {event.startDateTime
                        ? new Date(event.startDateTime).toLocaleDateString()
                        : "N/A"}
                    </p>

                    {/* Details Button */}
                    <button
                      onClick={() => navigate(`/events/${event._id}`)}
                      className="mt-2 w-full bg-[#c88585] hover:bg-[#b87575] text-white py-2 rounded-lg font-medium transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
