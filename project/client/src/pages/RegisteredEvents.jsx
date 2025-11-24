import React, { useEffect, useState } from "react";
import { /* useNavigate */ } from "react-router-dom";
import { Menu, Bell, User, LogOut, Calendar, Home } from "lucide-react";
import axios from "axios"; // uncomment after testing ui
//import { getMyRegisteredEvents } from "../testData/mockAPI"; // remove after ui testing
import StudentSidebar from "../components/StudentSidebar";
import Sidebar from "../components/Sidebar";
import ProfessorSidebar from "../components/ProfessorSidebar";

import "./RegisteredEvents.css";
import workshopImage from "../images/workshop.png";
import tripImage from "../images/trip.jpeg";
import conferenceImage from "../images/conference.jpg";
import bazaarImage from "../images/bazaar.jpeg";
// top of RegisteredEvents.jsx

const API =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:3001";

// one axios instance for this page
const http = axios.create({
  baseURL: API,
  withCredentials: true, // <-- enables cookie/session auth
});

// attach JWT if you have one
http.interceptors.request.use((cfg) => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("authToken") || "";
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
const RegisteredEvents = () => {
  const [events, setEvents] = useState({ upcoming: [], past: [] });
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [activeEventType, setActiveEventType] = useState("all");
  // no navigate required in this view
  const [viewEvent, setViewEvent] = useState(null);

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
  if (error) return <p className="my-events-error">{error}</p>;
  const getEventDate = (event) => {
    return event.startDateTime || event.startDate || event.date || new Date();
  };
  const getEventImage = (type) => {
    const map = {
      TRIP: tripImage,
      BAZAAR: bazaarImage,
      CONFERENCE: conferenceImage,
      WORKSHOP: workshopImage,
      BOOTH: workshopImage,
    };

    if (!type) return workshopImage;

    return map[type.toUpperCase()] || workshopImage;
  };

  const getEventTitle = (event) => {
    // For booths prefer attendee names when available
    try {
      const type = (event.type || "").toString().toUpperCase();
      if (type === "BOOTH") {
        const atts = event.attendees || event.attendeesNames || event.attendeesList || [];
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
    setViewEvent(event);
  };

  const filterEvents = (eventList) => {
    return eventList.filter((event) => {
      const matchesSearch = (event.title || event.workshopName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesCategory =
        activeEventType === "all" ||
        (event.type && (event.type || "").toLowerCase() === activeEventType);

      return matchesSearch && matchesCategory;
    });
  };
  const filteredUpcoming = filterEvents(events.upcoming);
  const filteredPast = filterEvents(events.past);

  const EventCard = ({ event, isPast = false }) => {
    const eventImage = getEventImage(event.type);
    const eventDate = getEventDate(event);
    console.log(
      "Event:",
      event.title,
      "Type:",
      event.type,
      "Image URL:",
      eventImage
    );
    return (
      <div className="event-card">
        <div
          className="event-image"
          style={{ backgroundImage: `url(${eventImage})` }}
        >
          <div className="event-category">{event.type || "Event"}</div>
          <div className="event-date">
            {new Date(eventDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>

        <div className="event-content">
          <h3 className="event-title">{getEventTitle(event)}</h3>
          <p className="event-organizer">Organized By: GUC Events</p>

          <div className="event-details">
            <div className="event-detail-item">
              <span className="detail-label">Date & Time:</span>
              <span className="detail-value">
                {new Date(eventDate).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>

            <div className="event-detail-item">
              <span className="detail-label">Location:</span>
              <span className="detail-value">{event.location || "TBD"}</span>
            </div>

            <div className="event-detail-item">
              <span className="detail-label">Type:</span>
              <span className="detail-value">{event.type || "Event"}</span>
            </div>
          </div>

          <div className="event-actions">
            <button
              className="btn-primary"
              onClick={() => handleViewDetails(event)}
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="flex h-screen bg-[#f5efeb]">
      {userRole === "student" ? (
        <StudentSidebar />
      ) : userRole === "professor" ? (
        <ProfessorSidebar />
      ) : (
        <Sidebar />
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto ml-64">
        {/* Header with sidebar toggle */}
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2"></div>
          <div className="flex items-center gap-2 md:gap-4 ml-4">
            <button className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors">
              <Bell size={20} className="text-[#567c8d]" />
            </button>
            <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center">
              <User size={20} className="text-[#2f4156]" />
            </div>
          </div>
        </header>
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
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search events..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="search-btn">Search</button>
                </div>
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
