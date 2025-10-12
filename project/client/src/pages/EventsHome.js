import { useState } from "react";
import { Link } from "react-router-dom";
import "../events.theme.css";
import NavBar from "../components/NavBar";
import FeatureCard from "../components/FeatureCard";
import { useLocalEvents } from "../hooks/useLocalEvents";
import { isEditable } from "../utils/validation";
import bazaar from "../images/bazaar.jpeg";
import trip from "../images/trip.jpeg";
<<<<<<< HEAD
import conference from "../images/conference.jpg"; // Add your conference image here
=======

>>>>>>> c637978253fc2b89a9d1a4accbc0439d96a635b7
function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function EventsHome() {
  const [filter, setFilter] = useState("all");
  const { list } = useLocalEvents();

<<<<<<< HEAD
  // All saved events (bazaars + trips + conferences), sorted by start date
=======
  // All events sorted by start time
>>>>>>> c637978253fc2b89a9d1a4accbc0439d96a635b7
  const events = list().sort(
    (a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)
  );

  const CARDS = [
    {
      type: "bazaars",
      to: "/bazaars/new",
      title: "Bazaars",
      subtitle: "Plan, edit, and publish upcoming bazaars.",
      cta: "Create Bazaar",
      tone: "sky",
      imageSrc: bazaar,
      imageAlt: "Students browsing a bazaar stall",
    },
    {
      type: "trips",
      to: "/trips/new",
      title: "Trips",
      subtitle: "Organize upcoming academic or fun trips.",
      cta: "Create Trip",
      tone: "sky",
      imageSrc: trip,
      imageAlt: "Students on a field trip bus",
    },
    {
      type: "conferences",
      to: "/conferences/new",
      title: "Conferences",
      subtitle: "Plan, edit, and publish conferences.",
      cta: "Create Conference",
      tone: "sky",
      imageSrc: conference,
      imageAlt: "Students attending a conference",
    },
  ];

  const visible = filter === "all" ? CARDS : CARDS.filter((c) => c.type === filter);

  return (
    <div className="events-theme events-home">
      <div className="container">
        <NavBar bleed />

        <header className="eo-pagehead-simple">
          <h1>Manage and organize all GUC events.</h1>
        </header>

        {/* Filter pills */}
        <div className="eo-filters">
          <button
            className={`eo-pill ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`eo-pill ${filter === "bazaars" ? "active" : ""}`}
            onClick={() => setFilter("bazaars")}
          >
            Bazaars
          </button>
          <button
            className={`eo-pill ${filter === "trips" ? "active" : ""}`}
            onClick={() => setFilter("trips")}
          >
            Trips
          </button>
          <button
            className={`eo-pill ${filter === "conferences" ? "active" : ""}`}
            onClick={() => setFilter("conferences")}
          >
            Conferences
          </button>
        </div>

        {/* Create cards */}
        <section className="eo-grid">
          {visible.map((c) => (
            <FeatureCard key={c.type} {...c} />
          ))}
        </section>

        {/* Event List */}
        <h2 style={{ margin: "24px 0 12px" }}>All Events</h2>
        <div className="grid">
          {events.length === 0 && (
            <div className="empty">No events yet. Create one above.</div>
          )}

          {events.map((ev) => (
            <article key={ev.id} className="card">
              <div className="chip">{ev.type}</div>

              <div className="kv kv-date">
                <span className="k">Starts:</span>
                <span className="v">{formatDate(ev.startDateTime)}</span>
              </div>
              <div className="kv kv-date">
                <span className="k">Ends:</span>
                <span className="v">{formatDate(ev.endDateTime)}</span>
              </div>

              <div className="kv">
                <span className="k">Name:</span>
                <span className="v">{ev.name}</span>
              </div>
              <div className="kv">
                <span className="k">Location:</span>
                <span className="v">{ev.location}</span>
              </div>

              {ev.shortDescription && <p>{ev.shortDescription}</p>}

              {/* Vendor request summary */}
              {ev.type === "BAZAAR" &&
                Array.isArray(ev.vendorRequests) &&
                ev.vendorRequests.length > 0 && (
                  <div className="vendor-requests-summary">
                    <strong>Vendor Requests:</strong>{" "}
                    {ev.vendorRequests.filter((r) => r.status === "pending").length} pending,{" "}
                    {ev.vendorRequests.filter((r) => r.status === "accepted").length} accepted,{" "}
                    {ev.vendorRequests.filter((r) => r.status === "rejected").length} rejected
                  </div>
              )}

              {/* Buttons */}
              <div className="actions">
                {/* Edit button */}
                <Link
                  className={`btn ${isEditable(ev.startDateTime) ? "" : "btn-disabled"}`}
                  to={
                    ev.type === "BAZAAR"
                      ? `/bazaars/${ev.id}`
                      : `/trips/${ev.id}`
                  }
                >
                  Edit
                </Link>

                {/* Vendor Participation button (only for bazaars) */}
                {ev.type === "BAZAAR" && (
                  <Link
                    className="btn btn-outline"
                    to={`/bazaars/${ev.id}/vendor-requests`}
                  >
<<<<<<< HEAD
                    Edit
                  </Link>
                ) : ev.type === "CONFERENCE" ? (
                  <Link
                    className={`btn ${
                      isEditable(ev.startDateTime) ? "" : "btn-disabled"
                    }`}
                    to={`/conferences/${ev.id}`}
                  >
                    Edit
                  </Link>
                ) : (
                  <Link
                    className={`btn ${
                      isEditable(ev.startDateTime) ? "" : "btn-disabled"
                    }`}
                    to={`/trips/${ev.id}`}
                  >
                    Edit
=======
                    Vendor Participation
>>>>>>> c637978253fc2b89a9d1a4accbc0439d96a635b7
                  </Link>
                )}

                {/* Notice if event has started */}
                {!isEditable(ev.startDateTime) && (
                  <span className="blocked">Event already started</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}