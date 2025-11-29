// client/src/pages/TaDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Menu,
  Bell,
  User,
  ArrowUp,
  ArrowDown,
  MapPin,
  Users,
  Clock,
  Heart,
  TrendingUp,
} from "lucide-react";

import TaSidebar from "../components/TaSidebar";
import EventTypeDropdown from "../components/EventTypeDropdown";
import SearchableDropdown from "../components/SearchableDropdown";

// Placeholder images for events
import conferencePlaceholder from "../images/Conferenceroommeetingconcept.jpeg";
import tripPlaceholder from "../images/Womanlookingatmapplanningtrip.jpeg";
import bazaarPlaceholder from "../images/Arabbazaarisolatedonwhitebackground_FreeVector.jpeg";
import workshopPlaceholder from "../images/download(12).jpeg";
const API_BASE = "http://localhost:3000";

const TaDashboard = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [professorFilter, setProfessorFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("asc");
  const [allEvents, setAllEvents] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [userId, setUserId] = useState(null);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [debouncedSearchLocation, setDebouncedSearchLocation] =
    useState(searchLocation);
  const [debouncedProfessorFilter, setDebouncedProfessorFilter] =
    useState(professorFilter);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchLocation(searchLocation), 300);
    return () => clearTimeout(t);
  }, [searchLocation]);

  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedProfessorFilter(professorFilter),
      300
    );
    return () => clearTimeout(t);
  }, [professorFilter]);

  // Get user ID from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserId(payload.id || payload.userId || payload._id);
      } catch (e) {
        console.error("Invalid token");
      }
    }
  }, []);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.append("search", debouncedSearch);
        if (debouncedSearchLocation)
          params.append("location", debouncedSearchLocation);
        if (debouncedProfessorFilter)
          params.append("professor", debouncedProfessorFilter);
        if (eventTypeFilter !== "All") params.append("type", eventTypeFilter);
        if (dateFilter) params.append("date", dateFilter);
        params.append("sort", "startDateTime");
        params.append("order", sortOrder === "asc" ? "desc" : "asc");

        const res = await fetch(`${API_BASE}/api/events/all?${params}`);
        const data = await res.json();
        if (res.ok) {
          const cleanData = data.filter(
            (e) => e.status?.toLowerCase() !== "archived"
          );
          setAllEvents(cleanData);
        } else {
          setAllEvents([]);
        }
      } catch (err) {
        console.error(err);
        setAllEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [
    debouncedSearch,
    debouncedSearchLocation,
    debouncedProfessorFilter,
    eventTypeFilter,
    dateFilter,
    sortOrder,
  ]);

  // Fetch favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("/api/users/me/favorites", {
          headers: { Authorization: `Bearer ${token}` },
        });
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

  // Extract unique filter options
  const uniqueLocations = React.useMemo(() => {
    const locations = allEvents
      .map((e) => e.location)
      .filter((loc) => loc && loc.trim() !== "");
    return [...new Set(locations)].sort();
  }, [allEvents]);

  const uniqueProfessors = React.useMemo(() => {
    const professors = allEvents
      .map((e) => e.professorsParticipating || e.facultyResponsible)
      .filter((prof) => prof && prof.trim() !== "");
    return [...new Set(professors)].sort();
  }, [allEvents]);

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

  if (loading) {
    return (
      <div className="flex h-screen bg-[#f5efeb] items-center justify-center">
        <p className="text-[#567c8d]">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f5efeb] ml-[260px]">
      {/* Sidebar */}
      <TaSidebar />

      <div className="flex-1 flex flex-col overflow-auto bg-[#f5efeb]">
        {/* Header */}
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-[#f5efeb] rounded-lg md:hidden"
          >
            <Menu size={24} className="text-[#2f4156]" />
          </button>

          <div className="flex flex-col md:flex-row gap-2 flex-1 mx-4">
            <div className="relative flex-[3]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#567c8d]"
                size={22}
              />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-base border border-[#c8d9e6] rounded-lg"
              />
            </div>

            <div className="md:w-40">
              <SearchableDropdown
                options={uniqueLocations}
                value={searchLocation}
                onChange={setSearchLocation}
                placeholder="All Locations"
                label="Location"
                icon={MapPin}
              />
            </div>

            <div className="md:w-40">
              <SearchableDropdown
                options={uniqueProfessors}
                value={professorFilter}
                onChange={setProfessorFilter}
                placeholder="All Professors"
                label="Professor"
                icon={Users}
              />
            </div>

            <EventTypeDropdown
              selected={eventTypeFilter}
              onChange={setEventTypeFilter}
            />

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-[#c8d9e6] rounded-lg"
            />

            <button
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
              className="px-4 py-2 bg-[#567c8d] text-white rounded-lg flex items-center gap-2"
            >
              {sortOrder === "asc" ? (
                <ArrowUp size={18} />
              ) : (
                <ArrowDown size={18} />
              )}
              {sortOrder === "asc" ? "Oldest" : "Newest"}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-[#f5efeb] rounded-lg"
            >
              <Bell size={20} className="text-[#567c8d]" />
              {notifications.some((n) => n.unread) && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center">
              <User size={20} className="text-[#2f4156]" />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="p-4 md:p-8">
          <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <h1 className="text-3xl font-bold text-[#2f4156] mb-2">
              Discover Events
            </h1>
            <button
              onClick={() => navigate("/favorites")}
              className="flex items-center gap-2 px-5 py-2 bg-white border-2 border-[#c8d9e6] rounded-xl hover:border-red-300 hover:bg-red-50 shadow-sm"
            >
              <Heart
                size={20}
                className={
                  favorites.length > 0
                    ? "fill-red-500 text-red-500"
                    : "text-[#567c8d]"
                }
              />
              My Favorites
              {favorites.length > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {favorites.length}
                </span>
              )}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <p className="text-sm text-blue-600 font-medium mb-1">
                Total Events
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {allEvents.length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <p className="text-sm text-purple-600 font-medium mb-1">
                Favorites
              </p>
              <p className="text-2xl font-bold text-purple-900">
                {favorites.length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <p className="text-sm text-green-600 font-medium mb-1">
                Event Types
              </p>
              <p className="text-2xl font-bold text-green-900">
                {new Set(allEvents.map((e) => e.type).filter(Boolean)).size}
              </p>
            </div>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {allEvents.map((e) => {
              const fallbackImage =
                {
                  TRIP: tripPlaceholder,
                  BAZAAR: bazaarPlaceholder,
                  CONFERENCE: conferencePlaceholder,
                  WORKSHOP: workshopPlaceholder,
                  BOOTH: workshopPlaceholder,
                }[e.type] || workshopPlaceholder;

              const eventDate = e.startDateTime
                ? new Date(e.startDateTime).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "";

              return (
                <div
                  key={e._id}
                  className="bg-white border border-[#c8d9e6] rounded-2xl shadow-sm overflow-hidden group"
                >
                  <div className="h-48 w-full bg-gray-200 relative overflow-hidden">
                    <img
                      src={e.image || fallbackImage}
                      alt={e.title}
                      className="h-full w-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/90 backdrop-blur-sm text-[#2f4156] px-3 py-1.5 rounded-full text-xs font-semibold shadow-md">
                        {e.type}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleFavorite(e._id)}
                      className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg hover:scale-110 transition-all"
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
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-xl text-[#2f4156] mb-2 line-clamp-2 min-h-[3.5rem]">
                      {e.title}
                    </h3>
                    <div className="space-y-2 mb-4">
                      {e.location && (
                        <div className="flex items-center gap-2 text-sm text-[#567c8d]">
                          <MapPin size={16} />
                          <span>{e.location}</span>
                        </div>
                      )}
                      {eventDate && (
                        <div className="flex items-center gap-2 text-sm text-[#567c8d]">
                          <Clock size={16} />
                          <span>{eventDate}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/events/${e._id}`)}
                      className="mt-4 w-full bg-gradient-to-r from-[#567c8d] to-[#45687a] text-white py-2.5 rounded-lg font-medium hover:from-[#45687a] hover:to-[#567c8d] transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TaDashboard;
