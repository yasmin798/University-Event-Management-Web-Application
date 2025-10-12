import { useState } from "react";
import { Link } from "react-router-dom";
import "../events.theme.css";
import NavBar from "../components/NavBar";
import FeatureCard from "../components/FeatureCard";
import { useLocalEvents } from "../hooks/useLocalEvents";
import { isEditable } from "../utils/validation";
import bazaar from "../images/bazaar.jpeg";
import trip from "../images/trip.jpeg";
import conference from "../images/conference.jpg";

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
      subtitle: "Plan, edit, and publish upcoming conferences.",
      cta: "Create Conference",
      tone: "sky",
      imageSrc: conference,
      imageAlt: "Students attending a conference",
      style: { "--cta-margin-top": "-10px" },
    },
  ];

  const visible =
    filter === "all" ? CARDS : CARDS.filter((c) => c.type === filter);

  return (
    <div className="events-theme events-home">
      <div className="container">
        <NavBar bleed />
        <header className="eo-pagehead-simple">
          <h1>Manage and organize all GUC events.</h1>
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
          <button
            className={`eo-pill ${filter === "conferences" ? "active" : ""}`}
            onClick={() => setFilter("conferences")}
          >
            Conferences
          </button>
        </div>

        <section className="eo-grid">
          {visible.map((c) => (
            <FeatureCard key={c.type} {...c} />
          ))}
        </section>

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

              <div className="actions">
                {ev.type === "BAZAAR" ? (
                  <>
                    <Link
                      className={`btn ${isEditable(ev.startDateTime) ? "" : "btn-disabled"}`}
                      to={`/bazaars/${ev.id}`}
                    >
                      Edit
                    </Link>
                    <Link
                      className={`btn ${isEditable(ev.startDateTime) ? "" : "btn-disabled"}`}
                      to={`/bazaars/${ev.id}/vendor-requests`}
                    >
                      Vendor Requests
                    </Link>
                  </>
                ) : ev.type === "CONFERENCE" ? (
                  <Link
                    className={`btn ${isEditable(ev.startDateTime) ? "" : "btn-disabled"}`}
                    to={`/conferences/${ev.id}`}
                  >
                    Edit
                  </Link>
                ) : (
                  <Link
                    className={`btn ${isEditable(ev.startDateTime) ? "" : "btn-disabled"}`}
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

      <style jsx>{`
        .eo-grid [data-type="conferences"] .feature-cta,
        .eo-grid .feature-card:nth-child(3) .btn,
        .eo-grid [style*="--cta-margin-top"] .btn {
          margin-top: var(--cta-margin-top, -10px) !important;
        }
      `}</style>
    </div>
  );
}