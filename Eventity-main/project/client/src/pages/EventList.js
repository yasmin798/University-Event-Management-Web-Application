// client/src/pages/EventsHome.js
import { useState } from "react";
import { Link } from "react-router-dom";
import "../events.theme.css";
import NavBar from "../components/NavBar";
import FeatureCard from "../components/FeatureCard";
import { useLocalEvents } from "../hooks/useLocalEvents";
import { isEditable } from "../utils/validation";
import bazaar from "../images/bazaar.jpeg";
import trip from "../images/trip.jpeg";
function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short", // Tue
    month: "short", // Oct
    day: "numeric", // 8
    hour: "numeric", // 2 AM
    minute: "2-digit", // 20
  });
}

export default function EventsHome() {
  const [filter, setFilter] = useState("all");
  const { list } = useLocalEvents();

  const all = list().sort(
    (a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)
  );
  const events = all;

  const CARDS = [
    {
      type: "bazaars",
      to: "/bazaars/new",
      title: "Bazaars",
      subtitle: "Create bazaars",
      cta: "Create Bazaar",
      tone: "sky",
      imageSrc: bazaar,
      imageAlt: "Students browsing a bazaar stall",
    },
    {
      type: "trips",
      to: "/trips/new",
      title: "Trips",
      subtitle: "Create trips",
      cta: "Create Trip",
      tone: "sky",
      imageSrc: trip,
      imageAlt: "Students on a field trip bus",
    },
  ];

  const visible =
    filter === "all" ? CARDS : CARDS.filter((c) => c.type === filter);

  return (
    <div className="events-theme events-home">
      <div className="container">
        <NavBar bleed />

        <header className="eo-pagehead-simple">
          <h1>Events</h1>
          <p className="eo-sub">Manage and organize all GUC events.</p>
        </header>

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
        </div>

        {/* Create cards */}
        <section className="eo-grid">
          {visible.map((c) => (
            <FeatureCard key={c.type} {...c} />
          ))}
        </section>

        {/* All Events (cards with labeled fields) */}
        <h2 style={{ margin: "24px 0 12px" }}>All Events</h2>
        <div className="grid">
          {events.length === 0 && (
            <div className="empty">No events yet. Create one above.</div>
          )}

          {events.map((ev) => (
            <article key={ev.id} className="card">
              <div className="chip">{ev.type}</div>

              {/* Labeled dates */}
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

              <div className="actions">
                {ev.type === "BAZAAR" ? (
                  <Link
                    className={`btn ${
                      isEditable(ev.startDateTime) ? "" : "btn-disabled"
                    }`}
                    to={`/bazaars/${ev.id}`}
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
                  </Link>
                )}
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
