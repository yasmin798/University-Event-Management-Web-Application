import React, { useEffect, useState } from "react";
import axios from "axios"; // uncomment after testing ui
//import { getMyRegisteredEvents } from "../testData/mockAPI"; // remove after ui testing
import "./RegisteredEvents.css";
import workshopImage from "../images/workshop.png";
import tripImage from "../images/trip.jpeg";
import conferenceImage from "../images/conference.jpg";
import bazaarImage from "../images/bazaar.jpeg";

const RegisteredEvents = () => {
  const [events, setEvents] = useState({ upcoming: [], past: [] });
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [activeEventType, setActiveEventType] = useState("all");
  
 useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in to view your registered events.");
          return;
        }
        const res = await axios.get(
          "http://localhost:3000/api/users/me/registered-events",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setEvents(res.data);
      } catch (err) {
        setError(err.response?.data.error || "Failed to load events. Ensure you are logged in.");
      }
    };
    fetchEvents();
  }, []); // Uncommented backend call; removed mock

  useEffect(() => {
    if (selectedCategory) {
      setActiveEventType(selectedCategory);
    } else {
      setActiveEventType("all");
    }
  }, [selectedCategory]);

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
    const type = eventType.toLowerCase();
    return eventTypeImages[type] || eventTypeImages.default;
  };

  const filterEvents = (eventList) => {
    return eventList.filter((event) => {
      const matchesSearch = event.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      
      const matchesCategory = 
        activeEventType === "all" || 
        (event.type && event.type.toLowerCase() === activeEventType);
      
      return matchesSearch && matchesCategory;
    });
  };
  const filteredUpcoming = filterEvents(events.upcoming);
  const filteredPast = filterEvents(events.past);

  const EventCard = ({ event, isPast = false }) => {
    const eventImage = getEventImage(event.type);
    console.log('Event:', event.title, 'Type:', event.type, 'Image URL:', eventImage);
    return (
      <div className="event-card">
        <div
          className="event-image"
          style={{ backgroundImage: `url(${eventImage})` }}
        >
          <div className="event-category">{event.type || "Event"}</div>
          <div className="event-date">
            {new Date(event.startDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>

        <div className="event-content">
          <h3 className="event-title">{event.title}</h3>
          <p className="event-organizer">Organized By: GUC Events</p>

          <div className="event-details">
            <div className="event-detail-item">
              <span className="detail-label">Date & Time:</span>
              <span className="detail-value">
                {new Date(event.startDateTime).toLocaleString("en-US", {
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
            <button className="btn-primary">View Details</button>
            {!isPast && (
              <button className="btn-secondary">Cancel Registration</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
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
                > Clear Filters
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
  );
};

export default RegisteredEvents;
