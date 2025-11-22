import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Menu,
  Bell,
  User,
  LogOut,
  Calendar,
  Map,
  Heart,
} from "lucide-react";
import workshopPlaceholder from "../images/workshop.png";
import EventTypeDropdown from "../components/EventTypeDropdown";
// boothAPI not used when fetching unified server events

import tripPlaceholder from "../images/trip.jpeg";
import bazaarPlaceholder from "../images/bazaar.jpeg";
import conferencePlaceholder from "../images/conference.jpg";
// server-side event dates will be parsed when needed
const TaDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("");
  const [professorFilter, setProfessorFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // workshops/booths removed in favor of server-side unified events
  const [favorites, setFavorites] = useState([]);

  const [allEvents, setAllEvents] = useState([]);
  const [serverLoading, setServerLoading] = useState(true);
  // Debounced inputs to avoid refetching on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [debouncedProfessor, setDebouncedProfessor] = useState(professorFilter);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedProfessor(professorFilter), 300);
    return () => clearTimeout(t);
  }, [professorFilter]);

  // server-side unified events will be fetched below

  // local workshop/booth fetch removed (server provides unified endpoint)

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch("/api/users/me/favorites", { headers });
        if (res.ok) {
          const data = await res.json();
          setFavorites(data.map((e) => e._id));
        }
      } catch (err) {
        console.error("Failed to fetch favorites", err);
      }
    };
    fetchFavorites();
  }, []);

  // Fetch unified events from server with filters
  useEffect(() => {
    const fetchEvents = async () => {
      setServerLoading(true);
      try {
        const params = new URLSearchParams();
        const searchValue = [debouncedSearch, debouncedProfessor]
          .filter(Boolean)
          .join(" ");
        if (searchValue) params.append("search", searchValue);
        if (locationFilter) params.append("location", locationFilter);
        if (eventTypeFilter && eventTypeFilter !== "All")
          params.append("type", eventTypeFilter);
        params.append("sort", "startDateTime");
        params.append("order", sortOrder === "asc" ? "desc" : "asc");

        const res = await fetch(`/api/events/all?${params}`);
        if (res.ok) {
          const data = await res.json();
          setAllEvents(data);
        } else {
          setAllEvents([]);
        }
      } catch (err) {
        console.error("Failed to fetch events", err);
        setAllEvents([]);
      } finally {
        setServerLoading(false);
      }
    };

    fetchEvents();
  }, [
    debouncedSearch,
    eventTypeFilter,
    locationFilter,
    debouncedProfessor,
    sortOrder,
  ]);

  // Toggle favorite
  const toggleFavorite = async (eventId) => {
    const method = favorites.includes(eventId) ? "DELETE" : "POST";
    const url = `/api/users/me/favorites${
      method === "DELETE" ? `/${eventId}` : ""
    }`;
    try {
      const token = localStorage.getItem("token");
      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : { "Content-Type": "application/json" };
      await fetch(url, {
        method,
        headers,
        body: method === "POST" ? JSON.stringify({ eventId }) : undefined,
      });
      setFavorites((prev) =>
        prev.includes(eventId)
          ? prev.filter((id) => id !== eventId)
          : [...prev, eventId]
      );
    } catch (err) {
      console.error("Favorite toggle failed", err);
    }
  };

  const loading = serverLoading;

  const formatEventDate = (dateTimeStr) => {
    if (!dateTimeStr) return "N/A";
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  // server events used; local booth/workshop console logging removed
  // Filter events (only future published events)
  const filteredEvents = allEvents
    .filter((e) => {
      if (e.type === "BOOTH") return true; // always show booths
      if (!e.startDateTime && !e.startDate && !e.date) return false; // booths without dates
      const now = new Date();
      const eventDate = new Date(e.startDateTime || e.startDate || e.date);
      return eventDate > now;
    })
    .filter((e) => {
      const name = (
        e.title ||
        e.name ||
        e.workshopName ||
        e.bazaarName ||
        ""
      ).toLowerCase();
      const profs = (e.professorsParticipating || "").toLowerCase();
      const matchesSearch =
        name.includes(searchTerm.toLowerCase()) ||
        profs.includes(searchTerm.toLowerCase());
      const matchesProfessor =
        !professorFilter || profs.includes(professorFilter.toLowerCase());
      const matchesLocation =
        !locationFilter ||
        (e.location || "").toLowerCase().includes(locationFilter.toLowerCase());
      const matchesType =
        eventTypeFilter === "All" || e.type === eventTypeFilter;
      return (
        matchesSearch && matchesType && matchesProfessor && matchesLocation
      );
    });

  const handleRegisteredEvents = () => {
    navigate("/events/registered");
    closeSidebar();
  };

  // Update this function
  const handleCourtsAvailability = () => {
    navigate("/courts-availability"); // Change this line from "/courts/availability" to "/courts-availability"
    closeSidebar();
  };

  const handleGymSessions = () => {
    navigate("/gym-sessions-register");
    closeSidebar();
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) navigate("/");
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Navigate to unified event details
  const handleDetails = (event) => {
    navigate(`/events/${event._id}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#f5efeb] items-center justify-center">
        <p className="text-[#567c8d]">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f5efeb]">
      {/* Sidebar - unchanged */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        ></div>
      )}
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
          <button
            onClick={closeSidebar}
            className="p-2 hover:bg-[#567c8d] rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
        <div className="flex-1 px-4 mt-4 space-y-2">
          <button
            onClick={handleRegisteredEvents}
            className="w-full flex items-center gap-3 bg-[#567c8d] hover:bg-[#45687a] text-white py-3 px-4 rounded-lg transition-colors text-left"
          >
            <Calendar size={18} />
            Registered Events
          </button>
          <button
            onClick={() => {
              navigate("/favorites");
              closeSidebar();
            }}
            className="w-full flex items-center gap-3 bg-[#567c8d] hover:bg-[#45687a] text-white py-3 px-4 rounded-lg transition-colors text-left"
          >
            <Heart size={18} />
            Favorites
          </button>
          <button
            onClick={handleCourtsAvailability}
            className="w-full flex items-center gap-3 bg-[#567c8d] hover:bg-[#45687a] text-white py-3 px-4 rounded-lg transition-colors text-left"
          >
            <Map size={18} />
            Courts Availability
          </button>
          <button
            onClick={handleGymSessions}
            className="w-full flex items-center gap-3 bg-[#567c8d] hover:bg-[#45687a] text-white py-3 px-4 rounded-lg transition-colors text-left"
          >
            <Calendar size={18} />
            Gym Sessions
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-[#c88585] hover:bg-[#b87575] text-white py-3 px-4 rounded-lg transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Main content - header unchanged */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors"
          >
            <Menu size={24} className="text-[#2f4156]" />
          </button>
          <div className="relative flex-1 max-w-md flex items-center">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#567c8d]"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by name or professor"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#c8d9e6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#567c8d]"
            />
            <EventTypeDropdown
              selected={eventTypeFilter}
              onChange={setEventTypeFilter}
            />
          </div>
          <div className="hidden md:flex md:items-center md:gap-2">
            <input
              type="text"
              placeholder="Professor"
              value={professorFilter}
              onChange={(e) => setProfessorFilter(e.target.value)}
              className="px-3 py-2 border border-[#c8d9e6] rounded-lg"
            />
            <input
              type="text"
              placeholder="Location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 border border-[#c8d9e6] rounded-lg"
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
          <div className="flex items-center gap-2 md:gap-4 ml-4">
            <button className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors">
              <Bell size={20} className="text-[#567c8d]" />
            </button>
            <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center">
              <User size={20} className="text-[#2f4156]" />
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#2f4156] mb-6">
            Available Events
          </h1>
          {filteredEvents.length === 0 ? (
            <p className="text-[#567c8d]">No events found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredEvents.map((e) => (
                <div
                  key={e._id}
                  className="bg-[#fdfdfd] border border-[#c8d9e6] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="h-40 w-full bg-gray-200 relative">
                    <img
                      src={
                        e.image ||
                        (e.type === "TRIP"
                          ? tripPlaceholder
                          : e.type === "BAZAAR"
                          ? bazaarPlaceholder
                          : e.type === "CONFERENCE"
                          ? conferencePlaceholder
                          : workshopPlaceholder)
                      }
                      alt={
                        e.title ||
                        e.name ||
                        e.workshopName ||
                        e.bazaarName ||
                        e.tripName ||
                        e.conferenceName
                      }
                      className="h-full w-full object-cover"
                      onError={(target) => {
                        target.target.src =
                          e.type === "TRIP"
                            ? tripPlaceholder
                            : e.type === "BAZAAR"
                            ? bazaarPlaceholder
                            : e.type === "CONFERENCE"
                            ? conferencePlaceholder
                            : workshopPlaceholder;
                      }}
                    />
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        toggleFavorite(e._id);
                      }}
                      className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                    >
                      <Heart
                        size={18}
                        className={
                          favorites.includes(e._id)
                            ? "fill-red-500 text-red-500"
                            : "text-gray-600"
                        }
                      />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-[#2f4156] truncate">
                      {e.title || e.name || e.workshopName || "Untitled"}
                    </h3>
                    {e.professorsParticipating && (
                      <p className="text-sm text-[#567c8d] truncate">
                        Professors: {e.professorsParticipating}
                      </p>
                    )}
                    <p className="text-sm text-[#567c8d] truncate">
                      Type: {e.type || "N/A"}
                    </p>
                    <p className="text-sm text-[#567c8d] truncate">
                      Date:{" "}
                      {e.startDateTime || e.startDate || e.date
                        ? formatEventDate(
                            e.startDateTime || e.startDate || e.date
                          )
                        : "N/A"}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <button
                        className="flex-1 bg-[#567c8d] hover:bg-[#45687a] text-white py-2 px-3 rounded-lg transition-colors"
                        onClick={() => handleDetails(e)}
                      >
                        Details
                      </button>
                      {(e.type === "TRIP" || e.type === "WORKSHOP") && (
                        <button
                          className="flex-1 bg-[#c88585] hover:bg-[#b87575] text-white py-2 px-3 rounded-lg transition-colors"
                          onClick={() => navigate(`/events/register/${e._id}`)}
                        >
                          Register
                        </button>
                      )}
                    </div>
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

export default TaDashboard;
