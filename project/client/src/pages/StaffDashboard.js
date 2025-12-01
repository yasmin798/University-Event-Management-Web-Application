import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  User,
  Star,
  MessageCircle,
  MapPin,
  Users,
  ArrowUp,
  ArrowDown,
  Clock,
  TrendingUp,
  Calendar,
  Heart,
} from "lucide-react";

import workshopPlaceholder from "../images/workshop.png";
import boothPlaceholder from "../images/booth.jpg";
import conferenceImg from "../images/Conferenceroommeetingconcept.jpeg";
import tripImg from "../images/Womanlookingatmapplanningtrip.jpeg";
import bazaarImg from "../images/Arabbazaarisolatedonwhitebackground_FreeVector.jpeg";
import workshopImg from "../images/download(12).jpeg";
import EventTypeDropdown from "../components/EventTypeDropdown";
import SearchableDropdown from "../components/SearchableDropdown";
import StaffSidebar from "../components/StaffSidebar";

const API_BASE = "http://localhost:3000"; // Your working backend

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("All");
  const [searchLocation, setSearchLocation] = useState("");
  const [professorFilter, setProfessorFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [dateFilter, setDateFilter] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [serverLoading, setServerLoading] = useState(true);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedSearchLocation, setDebouncedSearchLocation] = useState("");
  const [debouncedProfessorFilter, setDebouncedProfessorFilter] = useState("");

  // Reviews state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

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

  // Fetch favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/users/me/favorites", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
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

  // Fetch all events
  useEffect(() => {
    const fetchEvents = async () => {
      setServerLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.append("search", debouncedSearch);
        if (debouncedSearchLocation)
          params.append("location", debouncedSearchLocation);
        if (debouncedProfessorFilter)
          params.append("professor", debouncedProfessorFilter);
        if (eventTypeFilter && eventTypeFilter !== "All")
          params.append("type", eventTypeFilter);
        if (dateFilter) params.append("date", dateFilter);
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
    debouncedSearchLocation,
    debouncedProfessorFilter,
    dateFilter,
    sortOrder,
  ]);

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

  // Load reviews for selected event
  const loadReviews = async (eventId) => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/events/${eventId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data || []);
        const myReview = data.find((r) => r.userId?.toString() === userId);
        if (myReview) {
          setMyRating(myReview.rating);
          setMyComment(myReview.comment || "");
        }
      }
    } catch (err) {
      console.error("Failed to load reviews", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const submitReview = async () => {
    if (!selectedEvent || myRating === 0) {
      alert("Please select a rating");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/api/events/${selectedEvent._id}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating: myRating,
            comment: myComment.trim() || null,
          }),
        }
      );

      if (res.ok) {
        const updated = await res.json();
        setReviews(updated);
        alert("Thank you for your review!");
        setMyRating(0);
        setMyComment("");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to submit review");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const toggleFavorite = async (eventId) => {
    const method = favorites.includes(eventId) ? "DELETE" : "POST";
    const url = `/api/users/me/favorites${
      method === "DELETE" ? `/${eventId}` : ""
    }`;
    try {
      const token = localStorage.getItem("token");
      await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
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

  const handleDetails = (event) => {
    navigate(`/events/${event._id}`);
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("⚠️ No token found, cannot fetch notifications");
          return;
        }

        console.log("📞 Fetching notifications from /api/notifications");
        const res = await fetch(`/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          console.log(`✅ Received ${data.length} notifications:`, data);
          setNotifications(data);
        } else {
          console.error(
            "❌ Failed to fetch notifications, status:",
            res.status
          );
        }
      } catch (err) {
        console.error("❌ Failed to load notifications", err);
      }
    };

    console.log("🔄 Setting up notifications fetch...");
    fetchNotifications();

    // Poll every 10 seconds for new notifications
    const interval = setInterval(() => {
      console.log("🔄 Polling for new notifications...");
      fetchNotifications();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAsRead = async (notifId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await fetch(`/api/notifications/${notifId}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, unread: false } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const closeModal = () => setSelectedEvent(null);

  const filteredEvents = allEvents
    .filter((e) => e.status !== "archived") // ← hide archived events
    .filter((e) => {
      const name = (e.title || e.name || e.workshopName || "").toLowerCase();
      const profs = (e.professorsParticipating || "").toLowerCase();
      const location = (e.location || "").toLowerCase();
      const matchesSearch =
        name.includes(searchTerm.toLowerCase()) ||
        profs.includes(searchTerm.toLowerCase());
      const matchesLocation =
        !searchLocation ||
        profs.includes(searchLocation.toLowerCase()) ||
        location.includes(searchLocation.toLowerCase());
      const matchesType =
        eventTypeFilter === "All" || e.type === eventTypeFilter;
      return matchesSearch && matchesType && matchesLocation;
    });

  const formatEventDate = (date) =>
    !date
      ? "N/A"
      : new Date(date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

  // Review logic
  const hasPassed =
    selectedEvent &&
    new Date(
      selectedEvent.endDateTime ||
        selectedEvent.startDateTime ||
        selectedEvent.startDate
    ) < new Date();
  const alreadyReviewed = reviews.some((r) => r.userId?.toString() === userId);
  const isBazaarOrBooth =
    selectedEvent &&
    (selectedEvent.type === "BAZAAR" || selectedEvent.type === "BOOTH");
  const canReview = userId && hasPassed && !alreadyReviewed && isBazaarOrBooth;

  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  if (serverLoading) {
    return (
      <div className="flex h-screen bg-[#f5efeb] items-center justify-center">
        <p className="text-[#567c8d]">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="events-theme flex min-h-screen bg-[#f5efeb] ml-[260px]">
      {/* ---- FIXED SIDEBAR ---- */}
      <StaffSidebar />

      {/* ---- MAIN CONTENT ---- */}
      <div className="flex-1 flex flex-col overflow-auto bg-[#f5efeb]">
        {/* Header */}
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4 flex items-center justify-between">
          {/* Search + Filters */}
          <div className="flex flex-col md:flex-row gap-2 flex-1 mx-4">
            <div className="relative md:w-48 flex-shrink-0">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#567c8d]"
                size={18}
              />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2 text-base border border-[#c8d9e6] rounded-lg"
              />
            </div>

            <div className="md:w-44 flex-shrink-0">
              <SearchableDropdown
                options={uniqueLocations}
                value={searchLocation}
                onChange={setSearchLocation}
                placeholder="All Locations"
                label="Location"
                icon={MapPin}
              />
            </div>

            <div className="md:w-44 flex-shrink-0">
              <SearchableDropdown
                options={uniqueProfessors}
                value={professorFilter}
                onChange={setProfessorFilter}
                placeholder="All Professors"
                label="Professor"
                icon={Users}
              />
            </div>

            <div className="flex-shrink-0">
              <EventTypeDropdown
                selected={eventTypeFilter}
                onChange={setEventTypeFilter}
              />
            </div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-[#c8d9e6] rounded-lg flex-shrink-0"
            />

            <button
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
              className="px-4 py-2 bg-[#567c8d] text-white rounded-lg whitespace-nowrap flex items-center gap-2"
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
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-[#f5efeb] rounded-lg"
              >
                <Bell size={20} className="text-[#567c8d]" />
                {notifications.some((n) => n.unread) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
            </div>

            <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center">
              <User size={20} className="text-[#2f4156]" />
            </div>
          </div>
        </header>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="absolute right-6 top-20 bg-white shadow-xl rounded-xl w-80 border border-[#c8d9e6] z-50 p-4 max-h-96 overflow-auto">
            <h3 className="font-bold text-[#2f4156] mb-3">Notifications</h3>
            {notifications.length === 0 ? (
              <p className="text-sm text-[#567c8d]">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-3 mb-2 rounded-lg border ${
                    n.unread
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm text-[#2f4156] flex-1">{n.message}</p>
                    {n.unread && (
                      <button
                        onClick={() => markAsRead(n._id)}
                        className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Main Content */}
        <main className="p-4 md:p-8">
          {/* Header Section with Stats */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-[#2f4156] mb-2">
                  Discover Events
                </h1>
                <p className="text-[#567c8d]">
                  Explore and review campus events
                </p>
              </div>

              <button
                onClick={() => navigate("/favorites")}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-[#c8d9e6] rounded-xl hover:border-red-300 hover:bg-red-50 transition-all group shadow-sm"
              >
                <Heart
                  size={20}
                  className={
                    favorites.length > 0
                      ? "fill-red-500 text-red-500"
                      : "text-[#567c8d] group-hover:text-red-500"
                  }
                />
                <span className="font-medium text-[#2f4156]">My Favorites</span>
                {favorites.length > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {favorites.length}
                  </span>
                )}
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium mb-1">
                      Total Events
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {filteredEvents.length}
                    </p>
                  </div>
                  <div className="bg-blue-200 p-3 rounded-lg">
                    <Calendar size={24} className="text-blue-700" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium mb-1">
                      Favorites
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {favorites.length}
                    </p>
                  </div>
                  <div className="bg-purple-200 p-3 rounded-lg">
                    <Heart size={24} className="text-purple-700" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium mb-1">
                      Event Types
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {
                        new Set(
                          filteredEvents.map((e) => e.type).filter(Boolean)
                        ).size
                      }
                    </p>
                  </div>
                  <div className="bg-green-200 p-3 rounded-lg">
                    <TrendingUp size={24} className="text-green-700" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <p className="text-center text-[#567c8d] text-lg py-12">
              No events found matching your criteria.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredEvents.map((e) => {
                let cardImage = workshopImg;
                if (e.type === "TRIP") cardImage = tripImg;
                if (e.type === "BAZAAR") cardImage = bazaarImg;
                if (e.type === "CONFERENCE") cardImage = conferenceImg;
                if (e.type === "WORKSHOP") cardImage = workshopImg;
                if (e.type === "BOOTH") cardImage = boothPlaceholder;

                const fallbackImage = cardImage;

                // Format date
                const eventDate = e.startDateTime
                  ? new Date(e.startDateTime).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "";
                  if (e.type === "BOOTH") {
  return (
    <div
      key={e._id}
      className="bg-[#fdfdfd] border border-[#c8d9e6] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="h-40 w-full bg-gray-200 relative">
        <img
          src={e.image || boothPlaceholder}
          alt={e.title}
          className="h-full w-full object-cover"
          onError={(target) => {
            target.target.src = boothPlaceholder;
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
          {e.attendees?.[0]?.name || e.title || "Booth"}
        </h3>

        <p className="text-sm text-[#567c8d] truncate">Type: BOOTH</p>

        <p className="text-sm text-[#567c8d] truncate">
          Date: {new Date(e.startDateTime).toLocaleDateString()}
        </p>

        {e.location && (
          <p className="text-sm text-[#567c8d] truncate">
            Location: {e.location}
          </p>
        )}

        <div className="flex gap-2 mt-4">
          <button
            className="flex-1 bg-[#567c8d] hover:bg-[#45687a] text-white py-2 px-3 rounded-lg transition-colors"
            onClick={() => handleDetails(e)}
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
}


                return (
                  <div
                    key={e._id}
                    className="bg-white border border-[#c8d9e6] rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
                  >
                    <div className="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                      <img
                        src={e.image || fallbackImage}
                        alt={e.title}
                        className="h-full w-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                      />

                      {/* Event Type Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/90 backdrop-blur-sm text-[#2f4156] px-3 py-1.5 rounded-full text-xs font-semibold shadow-md">
                          {e.type}
                        </span>
                      </div>

                      {/* Favorite Button */}
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

                      {/* Gradient Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>

                    <div className="p-5">
                      <h3 className="font-bold text-xl text-[#2f4156] mb-2 line-clamp-2 min-h-[3.5rem]">
                        {e.type === "BOOTH"
                          ? e.boothTitle ||
                            e.attendees?.[0]?.name ||
                            e.title ||
                            e.name ||
                            "Booth"
                          : e.title ||
                            e.name ||
                            e.workshopName ||
                            "Untitled Event"}
                      </h3>

                      <div className="space-y-2 mb-4">
                        {e.location && (
                          <div className="flex items-center gap-2 text-sm text-[#567c8d]">
                            <MapPin size={16} className="flex-shrink-0" />
                            <span className="truncate">{e.location}</span>
                          </div>
                        )}

                        {eventDate && (
                          <div className="flex items-center gap-2 text-sm text-[#567c8d]">
                            <Clock size={16} className="flex-shrink-0" />
                            <span>{eventDate}</span>
                          </div>
                        )}

                        {e.allowedRoles && e.allowedRoles.length > 0 && (
                          <div
                            style={{
                              padding: "6px 10px",
                              background: "#e3f2fd",
                              borderRadius: "4px",
                              fontSize: "12px",
                              color: "#1976d2",
                              fontWeight: "500",
                            }}
                          >
                            🔒 Restricted to: {e.allowedRoles.join(", ")}
                          </div>
                        )}
                      </div>

                      <button
                        className="mt-4 w-full bg-gradient-to-r from-[#567c8d] to-[#45687a] text-white py-2.5 rounded-lg font-medium hover:from-[#45687a] hover:to-[#567c8d] transform hover:-translate-y-0.5 transition-all duration-200 shadow-md hover:shadow-lg"
                        onClick={() => handleDetails(e)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* REVIEW MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-screen overflow-y-auto p-8 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-6 text-3xl text-gray-500 hover:text-gray-800"
            >
              &times;
            </button>
            <h2 className="text-3xl font-bold text-[#2f4156] mb-6">
              {selectedEvent.title || selectedEvent.name}
            </h2>

            {hasPassed ? (
              <>
                <div className="flex items-center gap-3 mb-8">
                  <MessageCircle size={32} className="text-[#567c8d]" />
                  <h3 className="text-2xl font-bold">
                    Ratings & Reviews ({reviews.length})
                  </h3>
                </div>

                {reviews.length > 0 && (
                  <div className="bg-[#f5efeb] p-6 rounded-xl text-center mb-8">
                    <div className="text-6xl font-bold text-[#567c8d]">
                      {avgRating}
                    </div>
                    <div className="flex justify-center gap-2 my-3">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={40}
                          className={
                            n <= avgRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }
                        />
                      ))}
                    </div>
                    <p className="text-gray-600">
                      Based on {reviews.length} reviews
                    </p>
                  </div>
                )}

                {canReview && (
                  <div className="bg-[#f8f9fa] border-2 border-dashed border-[#c8d9e6] rounded-xl p-8 mb-8">
                    <h4 className="text-xl font-bold mb-6">
                      Leave Your Review
                    </h4>
                    <div className="flex gap-3 justify-center mb-6">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} onClick={() => setMyRating(n)}>
                          <Star
                            size={48}
                            className={
                              n <= myRating
                                ? "fill-yellow-500 text-yellow-500"
                                : "text-gray-400 hover:text-yellow-500 transition"
                            }
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      placeholder="Share your experience with this bazaar/booth..."
                      value={myComment}
                      onChange={(e) => setMyComment(e.target.value)}
                      className="w-full p-4 border border-[#c8d9e6] rounded-lg focus:ring-2 focus:ring-[#567c8d] resize-none"
                      rows={5}
                    />
                    <button
                      onClick={submitReview}
                      className="mt-6 w-full bg-[#567c8d] hover:bg-[#45687a] text-white py-4 rounded-lg text-lg font-semibold transition"
                    >
                      Submit Review
                    </button>
                  </div>
                )}

                <div className="space-y-6">
                  {reviews.map((r, i) => (
                    <div key={i} className="bg-gray-50 p-6 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#567c8d] rounded-full flex items-center justify-center text-white font-bold text-xl">
                            {r.userName?.[0] || "S"}
                          </div>
                          <div>
                            <p className="font-bold text-[#2f4156]">
                              {r.userName || "Staff"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              size={20}
                              className={
                                n <= r.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      {r.comment && (
                        <p className="text-gray-700 leading-relaxed">
                          {r.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-gray-600 py-12 text-lg">
                This event has not ended yet. Reviews will be available after it
                concludes.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
