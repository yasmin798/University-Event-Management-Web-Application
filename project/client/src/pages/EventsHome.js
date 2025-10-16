// client/src/pages/EventsHome.jsx
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../events.theme.css";
import NavBar from "../components/NavBar";
import FeatureCard from "../components/FeatureCard";
import { isEditable } from "../utils/validation";
import bazaar from "../images/bazaar.jpeg";
import trip from "../images/trip.jpeg";
import conference from "../images/conference.jpg";
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
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const { events, loading, refresh } = useServerEvents({ refreshMs: 0 });
  const [toast, setToast] = useState({ open: false, text: "" });

  // Styled confirm modal state
  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    body: "",
    onConfirm: null,
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
  });

  // Feature cards
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

  // Do the actual DELETE
  const doDelete = async (id, eventType) => {
    try {
      const res = await fetch(`/api/${eventType}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setToast({ open: true, text: err.error || "Failed to delete" });
        return;
      }
      setToast({ open: true, text: "Event Deleted successfully!" });
      refresh();
    } catch (e) {
      console.error("Delete error:", e);
      setToast({ open: true, text: "Network error: Could not delete" });
    }
  };

  // Open themed confirm dialog
  const handleDelete = (id, eventType) => {
    const typeLabel =
      eventType.charAt(0).toUpperCase() + eventType.slice(1, -1); // e.g. "Bazaars" -> "Bazaar"
    setConfirm({
      open: true,
      title: `Delete this ${typeLabel.toLowerCase()}?`,
      body: `Are you sure you want to delete this ${typeLabel.toLowerCase()}? This action cannot be undone.`,
      onConfirm: () => doDelete(id, eventType),
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    });
  };

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

        {/* Create cards */}
        <section className="eo-grid">
          {visible.map((c) => (
            <FeatureCard key={c.type} {...c} />
          ))}
        </section>

        {/* Vendor Requests Booth Button - Added above All Events list, shown when filter === "all" */}
        {filter === "all" && (
          <div style={{ margin: "24px 0" }}>
            <button
              className="btn"
              onClick={() => navigate("/vendor-requests-booths")}
            >
              Vendor Requests Booth
            </button>
          </div>
        )}

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
              const typeRaw = String(ev.type || "").toUpperCase();
              const isBazaar = typeRaw === "BAZAAR";
              const isTrip = typeRaw === "TRIP";
              const isConference = typeRaw === "CONFERENCE";
              const title = ev.title || ev.name || "Untitled";
              const editable = isEditable(ev.startDateTime);
              const hasRegistrations =
                Array.isArray(ev.registrations) && ev.registrations.length > 0;

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

                  {/* Conference-specific: Website */}
                  {isConference && ev.website && (
                    <div className="kv">
                      <span className="k">Website:</span>
                      <span className="v">
                        <a
                          href={ev.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {ev.website}
                        </a>
                      </span>
                    </div>
                  )}

                  {/* Optional: registration count */}
                  {hasRegistrations && (
                    <div className="kv">
                      <span className="k">Registered:</span>
                      <span className="v">
                        {ev.registrations.length} participants
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  {(ev?.shortDescription && ev.shortDescription.trim()) ||
                  (ev?.description && String(ev.description).trim()) ? (
                    <p>{ev.shortDescription || ev.description}</p>
                  ) : null}

                  <div
                    className="actions"
                    style={{ position: "relative", zIndex: 2 }}
                  >
                    {isBazaar ? (
                      <>
                        {editable ? (
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
                        )}
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(id, "bazaars")}
                          disabled={hasRegistrations}
                          title={
                            hasRegistrations
                              ? "Cannot delete: participants registered"
                              : "Delete this bazaar"
                          }
                        >
                          Delete
                        </button>
                      </>
                    ) : isTrip ? (
                      <>
                        {editable ? (
                          <Link className="btn" to={`/trips/${id}`}>
                            Edit
                          </Link>
                        ) : (
                          <button className="btn btn-disabled" disabled>
                            Edit
                          </button>
                        )}
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(id, "trips")}
                          disabled={hasRegistrations}
                          title={
                            hasRegistrations
                              ? "Cannot delete: participants registered"
                              : "Delete this trip"
                          }
                        >
                          Delete
                        </button>
                      </>
                    ) : isConference ? (
                      <>
                        {editable ? (
                          <Link className="btn" to={`/conferences/${id}`}>
                            Edit
                          </Link>
                        ) : (
                          <button className="btn btn-disabled" disabled>
                            Edit
                          </button>
                        )}
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(id, "conferences")}
                          disabled={hasRegistrations}
                          title={
                            hasRegistrations
                              ? "Cannot delete: participants registered"
                              : "Delete this conference"
                          }
                        >
                          Delete
                        </button>
                      </>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Themed confirmation modal (same look as Save/Cancel modal) */}
      {confirm.open && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm">
            <h2>{confirm.title || "Are you sure?"}</h2>
            <p>{confirm.body}</p>
            <div className="confirm-actions">
              <button
                className="btn btn-outline"
                onClick={() => setConfirm((c) => ({ ...c, open: false }))}
              >
                {confirm.cancelLabel || "Cancel"}
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  const fn = confirm.onConfirm;
                  setConfirm((c) => ({ ...c, open: false }));
                  fn && fn();
                }}
              >
                {confirm.confirmLabel || "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast.open && (
        <div className="eo-toast" role="status" aria-live="polite">
          <span className="eo-toast-text">{toast.text}</span>
          <button
            className="eo-toast-x"
            onClick={() => setToast({ open: false, text: "" })}
            aria-label="Close notification"
            title="Close"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}