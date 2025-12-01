import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  User,
  LogOut,
  Calendar,
  Home,
  Search,
  Heart,
  CreditCard,
  Wallet,
  MapPin,
  Users,
  ArrowUp,
  ArrowDown,
  Clock,
} from "lucide-react";
import axios from "axios"; // uncomment after testing ui
//import { getMyRegisteredEvents } from "../testData/mockAPI"; // remove after ui testing
import StudentSidebar from "../components/StudentSidebar";
import Sidebar from "../components/Sidebar";
import ProfessorSidebar from "../components/ProfessorSidebar";
import SearchableDropdown from "../components/SearchableDropdown";
import TaSidebar from "../components/TaSidebar";
import StaffSidebar from "../components/StaffSidebar";

import "./RegisteredEvents.css";
import workshopPlaceholder from "../images/workshop.png";
import boothPlaceholder from "../images/booth.jpg";
import conferenceImg from "../images/Conferenceroommeetingconcept.jpeg";
import tripImg from "../images/Womanlookingatmapplanningtrip.jpeg";
import bazaarImg from "../images/Arabbazaarisolatedonwhitebackground_FreeVector.jpeg";
import workshopImg from "../images/download(12).jpeg";
// top of RegisteredEvents.jsx

const API =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:3001";

// one axios instance for this page
const http = axios.create({
  baseURL: API,
  withCredentials: true, // <-- enables cookie/session auth
});
const getCurrentUserId = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id || payload._id;
  } catch (e) {
    return null;
  }
};

// attach JWT if you have one
http.interceptors.request.use((cfg) => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("authToken") || "";
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
const RegisteredEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState({ upcoming: [], past: [] });
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [professorFilter, setProfessorFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [activeEventType, setActiveEventType] = useState("all");
  const [viewEvent, setViewEvent] = useState(null);
  const [favorites, setFavorites] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  const [userRole, setUserRole] = useState("");
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await http.get("/api/users/me/registered-events");
        setEvents(res.data);
        setError("");
      } catch (err) {
        const status = err?.response?.status;
        const serverMsg = err?.response?.data?.error;
        console.error("Registered events failed:", {
          status,
          serverMsg,
          url: `${API}/api/users/me/registered-events`,
        });

        if (status === 401) {
          setError("You’re not logged in. Please log in again.");
          // optional: navigate("/login");
        } else if (status === 404) {
          setError("Endpoint not found at the API origin you’re using.");
        } else {
          setError(
            serverMsg || "Failed to load events. Ensure you are logged in."
          );
        }
      }
    };

    fetchEvents();
  }, []);

  // Uncommented backend call; removed mock

  useEffect(() => {
    if (selectedCategory) {
      setActiveEventType(selectedCategory);
    } else {
      setActiveEventType("all");
    }
  }, [selectedCategory]);
  // Sidebar helper (no local sidebar state needed here)
  // Fetch favorites
  const fetchFavorites = async () => {
    try {
      const response = await http.get("/api/users/me/favorites");
      const favoriteIds = response.data.map((fav) => fav._id);
      setFavorites(favoriteIds);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (eventId) => {
    try {
      if (favorites.includes(eventId)) {
        await http.delete(`/api/users/me/favorites/${eventId}`);
        setFavorites(favorites.filter((id) => id !== eventId));
      } else {
        await http.post("/api/users/me/favorites", { eventId });
        setFavorites([...favorites, eventId]);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  useEffect(() => {
    const getUserRole = () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          return (payload.role || "student").toLowerCase();
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
      return "student";
    };

    setUserRole(getUserRole());
    fetchFavorites();
  }, []);

  // Refetch favorites when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchFavorites();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);
  // navigation helpers unused in this view are omitted

  useEffect(() => {
    setSelectedCategory(activeEventType === "all" ? "" : activeEventType);
  }, [activeEventType]); // uncomment after testing ui
  /* useEffect(() => {
    getMyRegisteredEvents()
      .then(setEvents)
      .catch(() => setError("Failed to load events. Using mock data."));
  }, []);  // remove after testing ui
  useEffect(() => {
    if (selectedCategory) {
      setActiveEventType(selectedCategory);
    } else {
      setActiveEventType("all");
    }
  }, [selectedCategory]);
  useEffect(() => {
    setSelectedCategory(activeEventType === "all" ? "" : activeEventType);
  }, [activeEventType]); */

  // Combine all events for filter options
  const allEventsArray = React.useMemo(() => {
    return [...events.upcoming, ...events.past];
  }, [events]);

  // Extract unique locations
  const uniqueLocations = React.useMemo(() => {
    const locations = allEventsArray
      .map((e) => e.location)
      .filter((loc) => loc && loc.trim() !== "");
    return [...new Set(locations)].sort();
  }, [allEventsArray]);

  // Extract unique professors
  const uniqueProfessors = React.useMemo(() => {
    const professors = allEventsArray
      .map((e) => e.professorsParticipating || e.facultyResponsible)
      .filter((prof) => prof && prof.trim() !== "");
    return [...new Set(professors)].sort();
  }, [allEventsArray]);

  if (error) return <p className="my-events-error">{error}</p>;
  const getEventDate = (event) => {
    return event.startDateTime || event.startDate || event.date || new Date();
  };
  const getEventImage = (type) => {
    const map = {
      TRIP: tripImg,
      BAZAAR: bazaarImg,
      CONFERENCE: conferenceImg,
      WORKSHOP: workshopImg,
      BOOTH: boothPlaceholder,
    };

    if (!type) {
      console.warn("Event type is missing, using placeholder");
      return workshopPlaceholder;
    }

    const upperType = type.toUpperCase();
    const image = map[upperType];

    if (!image) {
      console.warn(`No image found for type: ${type}, using placeholder`);
      return workshopPlaceholder;
    }

    return image;
  };

  const getEventTitle = (event) => {
    // For booths prefer attendee names when available
    try {
      const type = (event.type || "").toString().toUpperCase();
      if (type === "BOOTH") {
        const atts =
          event.attendees || event.attendeesNames || event.attendeesList || [];
        if (Array.isArray(atts) && atts.length > 0) {
          const names = atts
            .map((a) => {
              if (!a) return null;
              if (typeof a === "string") return a;
              // object with name or email
              return a.name || a.fullName || a.email || null;
            })
            .filter(Boolean);
          if (names.length > 0) return names.join(", ");
        }

        // fallback to any attached title fields
        return event.title || event.bazaarName || `Booth ${event._id}`;
      }
    } catch (e) {
      // ignore and fallback
    }

    return event.title || event.workshopName || "Untitled Event";
  };

  const handleViewDetails = (event) => {
    navigate(`/events/${event._id}`);
  };

  const filterEvents = (eventList) => {
    return eventList.filter((event) => {
      // Unified search across name, location, and professor
      const matchesSearch =
        !searchTerm ||
        (event.title || event.workshopName || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (event.location || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (event.professorsParticipating || event.facultyResponsible || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Exact match for location filter
      const matchesLocation =
        !searchLocation || (event.location || "") === searchLocation;

      // Exact match for professor filter
      const matchesProfessor =
        !professorFilter ||
        (event.professorsParticipating || "") === professorFilter ||
        (event.facultyResponsible || "") === professorFilter;

      // Filter by event type
      const matchesCategory =
        activeEventType === "all" ||
        (event.type && (event.type || "").toLowerCase() === activeEventType);

      // Filter by date
      const matchesDate =
        !dateFilter ||
        (() => {
          const eventDate = new Date(
            event.startDateTime || event.startDate || event.date
          );
          const filterDate = new Date(dateFilter);
          return eventDate.toDateString() === filterDate.toDateString();
        })();

      return (
        matchesSearch &&
        matchesLocation &&
        matchesProfessor &&
        matchesCategory &&
        matchesDate
      );
    });
  };

  const sortEvents = (eventList) => {
    return [...eventList].sort((a, b) => {
      const dateA = new Date(a.startDateTime || a.startDate || a.date);
      const dateB = new Date(b.startDateTime || b.startDate || b.date);
      return sortOrder === "asc" ? dateB - dateA : dateA - dateB;
    });
  };

  const filteredUpcoming = sortEvents(filterEvents(events.upcoming));
  const filteredPast = sortEvents(filterEvents(events.past));

  const EventCard = ({ event, isPast = false }) => {
    const [paying, setPaying] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const navigate = useNavigate();

    // === GET CURRENT USER ID FROM JWT (safe & reliable) ===
    const getCurrentUserId = () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return null;
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.id || payload._id || null;
      } catch {
        return null;
      }
    };
    const currentUserId = getCurrentUserId();

    // === NORMALIZE EVENT TYPE & PRICE ===
    const eventType = (event.type || "").toString().trim().toLowerCase();
    const isWorkshopOrTrip = eventType === "workshop" || eventType === "trip";

    const price = Number(event.price || 0); // "150" → 150, null → 0
    const hasPrice = price > 0;

    const alreadyPaid = currentUserId
      ? event.paidUsers?.some((id) => id.toString() === currentUserId)
      : false;

    // === FETCH WALLET BALANCE ONCE ===
    useEffect(() => {
      const fetchBalance = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch("http://localhost:3001/api/wallet/balance", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setWalletBalance(data.walletBalance || 0);
          }
        } catch (err) {
          console.log("Wallet balance fetch failed");
        }
      };
      fetchBalance();
    }, []);

    // === PAYMENT HANDLER ===
    const handlePay = async (method) => {
      if (paying || alreadyPaid || !hasPrice) return;
      setPaying(true);

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          "http://localhost:3001/api/payments/pay-event",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              eventId: event._id,
              eventType: eventType, // already lowercase
              method, // "stripe" or "wallet"
            }),
          }
        );

        const data = await res.json();

        if (method === "stripe" && data.url) {
          window.location.href = data.url;
        } else if (data.success) {
          alert(`Paid ${price} EGP from wallet!`);
          window.location.reload();
        } else {
          alert(data.error || "Payment failed");
        }
      } catch (err) {
        alert("Network error. Try again.");
      } finally {
        setPaying(false);
      }
    };
    const handleRefund = async (eventId, eventType) => {
      if (
        !window.confirm(
          "Are you sure you want to request a refund? This cannot be undone."
        )
      )
        return;

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          "http://localhost:3001/api/payments/refund-event",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              eventId,
              eventType: eventType.toLowerCase(),
            }),
          }
        );

        const data = await res.json();

        if (res.ok) {
          alert(
            `Refund successful! ${data.refundedAmount} EGP returned to your wallet.`
          );
          window.location.reload();
        } else {
          alert(data.error || "Refund failed");
        }
      } catch (err) {
        alert("Network error. Please try again.");
      }
    };

    // Get event image
    const eventImage = getEventImage(event.type);

    // Format date
    const eventDate = event.startDateTime
      ? new Date(event.startDateTime).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "";

    return (
      <div className="bg-white border border-[#c8d9e6] rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
        {/* IMAGE & OVERLAYS */}
        <div className="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
          <img
            src={eventImage}
            alt={getEventTitle(event)}
            className="h-full w-full object-cover transform group-hover:scale-110 transition-transform duration-500"
          />

          {/* Event Type Badge */}
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm text-[#2f4156] px-3 py-1.5 rounded-full text-xs font-semibold shadow-md">
              {event.type || "Event"}
            </span>
          </div>

          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(event._id);
            }}
            className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg hover:scale-110 transition-all"
          >
            <Heart
              size={18}
              className={
                favorites.includes(event._id)
                  ? "fill-red-500 text-red-500"
                  : "text-gray-600"
              }
            />
          </button>

          {/* Gradient Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* CONTENT */}
        <div className="p-5">
          <h3 className="font-bold text-xl text-[#2f4156] mb-2 line-clamp-2 min-h-[3.5rem]">
            {getEventTitle(event)}
          </h3>

          <div className="space-y-2 mb-4">
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-[#567c8d]">
                <MapPin size={16} className="flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            )}

            {eventDate && (
              <div className="flex items-center gap-2 text-sm text-[#567c8d]">
                <Clock size={16} className="flex-shrink-0" />
                <span>{eventDate}</span>
              </div>
            )}

            {(event.professorsParticipating || event.facultyResponsible) && (
              <div className="flex items-center gap-2 text-sm text-[#567c8d]">
                <Users size={16} className="flex-shrink-0" />
                <span className="truncate">
                  {event.professorsParticipating || event.facultyResponsible}
                </span>
              </div>
            )}
          </div>

          {/* PAYMENT SECTION – ONLY FOR WORKSHOPS & TRIPS WITH PRICE */}
          {hasPrice && isWorkshopOrTrip && !isPast && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-lg font-bold text-emerald-700 mb-4">
                Registration Fee: {price} EGP
              </p>

              {alreadyPaid ? (
                <div className="flex items-center gap-3">
                  <div className="text-green-600 font-bold flex items-center gap-2">
                    Paid
                  </div>

                  {/* REFUND BUTTON — ONLY IF 14+ DAYS AWAY */}
                  {(() => {
                    const startDate = new Date(
                      event.startDateTime || event.startDate
                    );
                    const twoWeeksFromNow = new Date();
                    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
                    const canRefund = startDate > twoWeeksFromNow;

                    return canRefund ? (
                      <button
                        onClick={() => handleRefund(event._id, eventType)}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
                      >
                        Request Refund
                      </button>
                    ) : null;
                  })()}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* STRIPE BUTTON */}
                  <button
                    onClick={() => handlePay("stripe")}
                    disabled={paying}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-70 shadow-md hover:shadow-lg"
                  >
                    <CreditCard size={18} />
                    Pay with Card
                  </button>

                  {/* WALLET BUTTON */}
                  <button
                    onClick={() => handlePay("wallet")}
                    disabled={paying || walletBalance < price}
                    className={`w-full font-medium py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg ${
                      walletBalance >= price
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-gray-400 text-gray-700 cursor-not-allowed"
                    }`}
                  >
                    <Wallet size={18} />
                    Pay with Wallet ({walletBalance.toFixed(0)} EGP)
                  </button>
                </div>
              )}

              {/* INSUFFICIENT BALANCE MESSAGE */}
              {walletBalance < price && !alreadyPaid && (
                <p className="text-xs text-red-600 mt-3">
                  You need {(price - walletBalance).toFixed(0)} EGP more in your
                  wallet
                </p>
              )}
            </div>
          )}

          {/* VIEW DETAILS BUTTON */}
          <button
            className="mt-4 w-full bg-gradient-to-r from-[#567c8d] to-[#45687a] text-white py-2.5 rounded-lg font-medium hover:from-[#45687a] hover:to-[#567c8d] transform hover:-translate-y-0.5 transition-all duration-200 shadow-md hover:shadow-lg"
            onClick={() => handleViewDetails(event)}
          >
            View Details
          </button>
        </div>
      </div>
    );
  };
  return (
    <div className="flex h-screen bg-[#f5efeb]">
      {!userRole ? null : userRole === "student" ? (
        <StudentSidebar />
      ) : userRole === "professor" ? (
        <ProfessorSidebar />
      ) : userRole === "ta" ? (
        <TaSidebar />
      ) : userRole === "staff" ? (
        <StaffSidebar />
      ) : (
        <StudentSidebar /> // fallback
      )}{" "}
      {/* Main content */}
      <div className="flex-1 overflow-auto ml-64">
        {/* Registered Events Content */}
        <div className="my-events-page">
          {/* Hero Section with Background */}
          <section className="events-hero">
            <h1 className="hero-title">Registered Events</h1>
            <p className="hero-subtitle">
              Discover & Manage Your Event Registrations
            </p>

            <div className="search-filter-section">
              <div className="search-filter-bar">
                {/* Unified Search - searches name, location, and professor */}
                <div className="search-box" style={{ position: "relative" }}>
                  <Search
                    size={18}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#567c8d",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search events..."
                    className="search-input"
                    style={{ paddingLeft: "40px" }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Location Dropdown Filter */}
                <div style={{ width: "160px", flexShrink: 0 }}>
                  <SearchableDropdown
                    options={uniqueLocations}
                    value={searchLocation}
                    onChange={setSearchLocation}
                    placeholder="All Locations"
                    label="Location"
                    icon={MapPin}
                  />
                </div>

                {/* Professor Dropdown Filter */}
                <div style={{ width: "160px", flexShrink: 0 }}>
                  <SearchableDropdown
                    options={uniqueProfessors}
                    value={professorFilter}
                    onChange={setProfessorFilter}
                    placeholder="All Professors"
                    label="Professor"
                    icon={Users}
                  />
                </div>

                {/* Filter by Date */}
                <div
                  className="search-box"
                  style={{
                    position: "relative",
                    width: "160px",
                    flexShrink: 0,
                  }}
                >
                  <Calendar
                    size={18}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#567c8d",
                      pointerEvents: "none",
                      zIndex: 1,
                    }}
                  />
                  <input
                    type="date"
                    className="search-input"
                    style={{ paddingLeft: "40px" }}
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>

                {/* Sort Button */}
                <button
                  onClick={() =>
                    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                  }
                  className="search-btn"
                  style={{
                    backgroundColor: "#567c8d",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {sortOrder === "asc" ? (
                    <ArrowUp size={18} />
                  ) : (
                    <ArrowDown size={18} />
                  )}
                  {sortOrder === "asc" ? "Oldest" : "Newest"}
                </button>

                {/* Clear All Filters Button */}
                {(searchTerm ||
                  searchLocation ||
                  professorFilter ||
                  dateFilter ||
                  activeEventType !== "all") && (
                  <button
                    className="search-btn"
                    onClick={() => {
                      setSearchTerm("");
                      setSearchLocation("");
                      setProfessorFilter("");
                      setDateFilter("");
                      setActiveEventType("all");
                      setSelectedCategory("");
                    }}
                    style={{ backgroundColor: "#c88585" }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              <div className="quick-filters">
                <div
                  className={`filter-chip ${
                    activeEventType === "all" ? "active" : ""
                  }`}
                  onClick={() => setActiveEventType("all")}
                >
                  All Events
                </div>
                <div
                  className={`filter-chip ${
                    activeEventType === "workshop" ? "active" : ""
                  }`}
                  onClick={() => setActiveEventType("workshop")}
                >
                  Workshops
                </div>
                <div
                  className={`filter-chip ${
                    activeEventType === "trip" ? "active" : ""
                  }`}
                  onClick={() => setActiveEventType("trip")}
                >
                  Trips
                </div>
                <div
                  className={`filter-chip ${
                    activeEventType === "conference" ? "active" : ""
                  }`}
                  onClick={() => setActiveEventType("conference")}
                >
                  Conferences
                </div>
                <div
                  className={`filter-chip ${
                    activeEventType === "bazaar" ? "active" : ""
                  }`}
                  onClick={() => setActiveEventType("bazaar")}
                >
                  Bazaars
                </div>
                <div
                  className={`filter-chip ${
                    activeEventType === "booth" ? "active" : ""
                  }`}
                  onClick={() => setActiveEventType("booth")}
                >
                  Booths
                </div>
              </div>
            </div>
          </section>

          {/* Events Content */}
          <div className="events-content">
            {/* Upcoming Events Section */}
            <section className="events-section">
              <h2 className="section-title">Upcoming Events</h2>
              <div className="events-grid">
                {filteredUpcoming.length === 0 ? (
                  <div className="empty-state">
                    <p>No upcoming events registered.</p>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        setSearchTerm("");
                        setDateFilter("");
                        setActiveEventType("all");
                        setSelectedCategory("");
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  filteredUpcoming.map((event) => (
                    <EventCard key={event._id} event={event} />
                  ))
                )}
              </div>
            </section>

            {/* Past Events Section */}
            <section className="events-section">
              <h2 className="section-title">Past Events</h2>
              <div className="events-grid">
                {filteredPast.length === 0 ? (
                  <div className="empty-state">
                    <p>No past events to display.</p>
                  </div>
                ) : (
                  filteredPast.map((event) => (
                    <EventCard key={event._id} event={event} isPast={true} />
                  ))
                )}
              </div>
            </section>
            {viewEvent && (
              <div
                className="confirm-overlay"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                role="dialog"
                aria-modal="true"
              >
                <div
                  style={{
                    background: "white",
                    padding: "24px",
                    width: "500px",
                    maxHeight: "80vh",
                    overflowY: "auto",
                    borderRadius: "12px",
                    position: "relative",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
                  }}
                >
                  {/* CLOSE BUTTON */}
                  <button
                    onClick={() => setViewEvent(null)}
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      fontSize: "20px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>

                  <h2 style={{ fontWeight: 800, marginBottom: "10px" }}>
                    {viewEvent.title || viewEvent.workshopName}
                  </h2>

                  <div style={{ marginBottom: "10px" }}>
                    <strong>Type:</strong> {viewEvent.type}
                  </div>

                  <div>
                    <strong>Date:</strong>{" "}
                    {new Date(
                      viewEvent.startDateTime ||
                        viewEvent.startDate ||
                        viewEvent.date
                    ).toLocaleString("en-US")}
                  </div>

                  <div>
                    <strong>Location:</strong> {viewEvent.location || "TBD"}
                  </div>

                  {viewEvent.description && (
                    <div style={{ marginTop: "10px" }}>
                      <strong>Description:</strong>
                      <p>{viewEvent.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisteredEvents;
