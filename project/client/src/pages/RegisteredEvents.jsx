import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Bell, User, LogOut, Calendar, Home } from "lucide-react";
import axios from "axios"; // uncomment after testing ui
//import { getMyRegisteredEvents } from "../testData/mockAPI"; // remove after ui testing
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
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
  // Sidebar functions
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);
  useEffect(() => {
    const getUserRole = () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          // Decode the token to get user role (if stored in token)
          const payload = JSON.parse(atob(token.split(".")[1]));
          return payload.role || "student"; // Default to student if no role found
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
      return "student"; // Default fallback
    };

    setUserRole(getUserRole());
  }, []);
  const handleDashboard = () => {
    switch (userRole.toLowerCase()) {
      case "staff":
        navigate("/staff/dashboard");
        break;
      case "ta":
        navigate("/ta/dashboard");
        break;
      case "professor":
        navigate("/professor/dashboard");
        break;
      default:
        navigate("/student/dashboard");
        break;
    }
    closeSidebar();
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      navigate("/");
    }
  };

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
  const eventTypeImages = {
    all: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    workshop: workshopImage,
    trip: tripImage,
    conference: conferenceImage,
    bazaar: bazaarImage,
    booth:
      "https://i.pinimg.com/736x/ba/f9/75/baf9759b508018b68aa1802858610c27.jpg",
    default:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  };
  const getEventImage = (eventType) => {
    if (!eventType) return eventTypeImages.default;
    const type = (eventType || "").toLowerCase();
    return eventTypeImages[type] || eventTypeImages.default;
  };
  const handleViewDetails = (event) => {
    alert(
      `Event Details:\n\nTitle: ${
        event.title || event.workshopName
      }\nLocation: ${event.location || "TBD"}\nType: ${event.type || "Event"}`
    );
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
          <h3 className="event-title">
            {event.title || event.workshopName || "Untitled Event"}
          </h3>
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
      {/* Sidebar */}
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

        {/* Navigation Links */}
        <div className="flex-1 px-4 mt-4 space-y-2">
          {/* Dashboard Button - shows role-specific dashboard */}
          <button
            onClick={handleDashboard}
            className="w-full flex items-center gap-3 bg-[#567c8d] hover:bg-[#45687a] text-white py-3 px-4 rounded-lg transition-colors text-left"
          >
            <Home size={18} />
            {userRole
              ? `${
                  userRole.charAt(0).toUpperCase() + userRole.slice(1)
                } Dashboard`
              : "Dashboard"}
          </button>

          {/* Registered Events Button (current page) */}
          <button className="w-full flex items-center gap-3 bg-[#45687a] hover:bg-[#3a5a6d] text-white py-3 px-4 rounded-lg transition-colors text-left cursor-default">
            <Calendar size={18} />
            Registered Events
          </button>

          {/* Logout Button */}
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
        {/* Header with sidebar toggle */}
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors"
          >
            <Menu size={24} className="text-[#2f4156]" />
          </button>

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
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisteredEvents;
