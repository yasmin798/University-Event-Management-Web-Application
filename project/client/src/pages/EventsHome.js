// client/src/pages/EventsHome.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../events.theme.css";
import NavBar from "../components/NavBar";
import FeatureCard from "../components/FeatureCard";
import { isEditable } from "../utils/validation";
import bazaar from "../images/bazaar.jpeg";
import trip from "../images/trip.jpeg";
import conference from "../images/conference.jpg"; // keep if you want the 3rd card
//import { useLocalEvents } from "../hooks/useLocalEvents"; // ← the unified hook I gave you
import { useServerEvents } from "../hooks/useServerEvents";
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
function formatMoney(n) {
  if (n == null || n === "") return "—";
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(num);
}

export default function EventsHome() {
  const [filter, setFilter] = useState("all");
  //const { list } = useLocalEvents(); // async list()
  //const [events, setEvents] = useState([]);
  //const [loading, setLoading] = useState(true);
  const { events, loading } = useServerEvents({ refreshMs: 0 });
  // Load from server (then mirrors to local) or fallback to local if offline
  //useEffect(() => {
  // let alive = true;
  // (async () => {
  //  try {
  // const arr = await list();
  // if (alive)
  //  setEvents(
  // arr.sort(
  //  (a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)
  // )
  // );
  //} finally {
  //  if (alive) setLoading(false);
  //}
  // })();
  // return () => {
  //   alive = false;
  // };
  //}, [list]);

  // Feature cards (include Conferences like your teammate’s)
  const CARDS = useMemo(
    () => [
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
    ],
    []
  );

  const visible =
    filter === "all" ? CARDS : CARDS.filter((c) => c.type === filter);

  return (
    <div className="events-theme events-home">
      <div className="container">
        <NavBar bleed />

        <header className="eo-pagehead-simple">
          <h1>Manage and organize all GUC events.</h1>
        </header>

        {/* Filter pills */}
        <div className="eo-filters">
          {["all", "bazaars", "trips", "conferences"].map((f) => (
            <button
              key={f}
              className={`eo-pill ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Create … cards */}
        <section className="eo-grid">
          {visible.map((c) => (
            <FeatureCard key={c.type} {...c} />
          ))}
        </section>

        {/* with this */}
        <h1 className="eo-section-title">All Events</h1>

        {loading ? (
          <div className="empty">Loading…</div>
        ) : (
          <div className="grid">
            {events.length === 0 && (
              <div className="empty">No events yet. Create one above.</div>
            )}

            {events.map((ev) => {
              const id = ev._id || ev.id;
              // normalize type across local + server
              const typeRaw = String(ev.type || "").toUpperCase();
              const isBazaar = typeRaw === "BAZAAR";
              const isTrip = typeRaw === "TRIP";
              const isConference = typeRaw === "CONFERENCE";
              const title = ev.title || ev.name || "Untitled";

              return (
                <article key={id} className="card">
                  <div className="chip">{typeRaw}</div>

                  <div className="kv">
                    <span className="k">Name:</span>
                    <span className="v">{title}</span>
                  </div>
                  <div className="kv">
                    <span className="k">Location:</span>
                    <span className="v">{ev.location}</span>
                  </div>
                  <div className="kv kv-date">
                    <span className="k">Starts:</span>
                    <span className="v">{formatDate(ev.startDateTime)}</span>
                  </div>
                  <div className="kv kv-date">
                    <span className="k">Ends:</span>
                    <span className="v">{formatDate(ev.endDateTime)}</span>
                  </div>

                  {/* Bazaar-only: registration deadline */}
                  {isBazaar && ev.registrationDeadline && (
                    <div className="kv kv-date">
                      <span className="k">Registration Deadline:</span>
                      <span className="v">
                        {formatDate(ev.registrationDeadline)}
                      </span>
                    </div>
                  )}

                  {/* Trip-only: price & capacity */}
                  {isTrip && (ev.price != null || ev.capacity != null) && (
                    <>
                      <div className="kv">
                        <span className="k">Price:</span>
                        <span className="v">{formatMoney(ev.price)}</span>
                      </div>
                      <div className="kv">
                        <span className="k">Capacity:</span>
                        <span className="v">{ev.capacity ?? "—"}</span>
                      </div>
                    </>
                  )}

                  {/* ✅ Description for ANY type (works with shortDescription OR description) */}
                  {(ev?.shortDescription && ev.shortDescription.trim()) ||
                  (ev?.description && String(ev.description).trim()) ? (
                    <p>{ev.shortDescription || ev.description}</p>
                  ) : null}

                  <div
                    className="actions"
                    style={{ position: "relative", zIndex: 2 }}
                  >
                    {isBazaar ? (
                      isEditable(ev.startDateTime) ? (
                        <>
                          <Link className="btn" to={`/bazaars/${id}`}>
                            Edit
                          </Link>
                          <Link
                            className="btn"
                            to={`/bazaars/${id}/vendor-requests`}
                          >
                            Vendor Requests
                          </Link>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-disabled" disabled>
                            Edit
                          </button>
                          <button className="btn btn-disabled" disabled>
                            Vendor Requests
                          </button>
                        </>
                      )
                    ) : isTrip ? (
                      isEditable(ev.startDateTime) ? (
                        <Link className="btn" to={`/trips/${id}`}>
                          Edit
                        </Link>
                      ) : (
                        <button className="btn btn-disabled" disabled>
                          Edit
                        </button>
                      )
                    ) : isConference ? (
                      isEditable(ev.startDateTime) ? (
                        <Link className="btn" to={`/conferences/${id}`}>
                          Edit
                        </Link>
                      ) : (
                        <button className="btn btn-disabled" disabled>
                          Edit
                        </button>
                      )
                    ) : null}

                    {!isEditable(ev.startDateTime) && (
                      <span className="blocked">Event already started</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* keep their small CTA nudge for the 3rd card */}
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
