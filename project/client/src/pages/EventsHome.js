import { useMemo, useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../events.theme.css";
import NavBar from "../components/NavBar";
import FeatureCard from "../components/FeatureCard";
import { isEditable } from "../utils/validation";
import bazaar from "../images/bazaar.jpeg";
import trip from "../images/trip.jpeg";
import conference from "../images/conference.jpg";
import { useServerEvents } from "../hooks/useServerEvents";
import { workshopAPI } from "../api/workshopApi";  // Or wherever your API client is defined (e.g., ../api.js)
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
  const { events: otherEvents, loading: otherLoading, refresh: refreshOthers } = useServerEvents({ refreshMs: 0 });
  const [workshops, setWorkshops] = useState([]);
  const [workshopsLoading, setWorkshopsLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, text: "" });
  const [searchTerm, setSearchTerm] = useState("");

  
  // Styled confirm modal state
  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    body: "",
    onConfirm: null,
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
  });
  // Edit request modal state
  const [editRequest, setEditRequest] = useState({
    open: false,
    workshopId: null,
    message: "",
  });
  const fetchWorkshops = useCallback(async () => {
  setWorkshopsLoading(true);
  try {
    const data = await workshopAPI.getAllWorkshops();

    const normalizedWorkshops = data.map((w) => {
      const start = new Date(w.startDateTime);
      const end = new Date(w.endDateTime);

      return {
        ...w,
        type: "WORKSHOP",
        title: w.workshopName,
        name: w.workshopName,
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        description: w.shortDescription,
        registrations: w.registeredUsers || [],
      };
    });

    setWorkshops(normalizedWorkshops);
  } catch (error) {
    console.error("Error fetching workshops:", error);
    setToast({ open: true, text: "Failed to load workshops" });
  } finally {
    setWorkshopsLoading(false);
  }
}, []);

  useEffect(() => {
    fetchWorkshops();
  }, [fetchWorkshops]);
  const refresh = useCallback(() => {
    refreshOthers();
    fetchWorkshops();
  }, [refreshOthers, fetchWorkshops]);
  const events = [...otherEvents, ...workshops];
  const loading = otherLoading || workshopsLoading;
const filteredEvents = useMemo(() => {
  let evs = filter === "all" 
    ? events 
    : events.filter(ev => ev.type.toLowerCase() === filter.slice(0, -1));

  if (searchTerm.trim() === "") return evs;

  return evs.filter((ev) => {
    const name = (ev.title || ev.name || "").toLowerCase();
    const desc = (ev.shortDescription || ev.description || "").toLowerCase();
    return (
      name.includes(searchTerm.toLowerCase()) ||
      desc.includes(searchTerm.toLowerCase())
    );
  });
}, [events, filter, searchTerm]);

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
  // Do the actual status update
  const doUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/workshops/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setToast({ open: true, text: err.error || "Failed to update" });
        return;
      }
      setToast({ open: true, text: `Workshop ${newStatus} successfully!` });
      refresh();
    } catch (e) {
      console.error("Update error:", e);
      setToast({ open: true, text: "Network error: Could not update" });
    }
  };
  // Do the actual edit request
  const doRequestEdits = async () => {
  try {
    const token = localStorage.getItem("token"); // Or whatever key you used
    const res = await fetch(`/api/workshops/${editRequest.workshopId}/request-edits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: editRequest.message }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setToast({ open: true, text: err.error || "Failed to send request" });
      return;
    }

    setToast({ open: true, text: "Edit request sent successfully!" });
    setEditRequest({ open: false, workshopId: null, message: "" });
    refresh();
  } catch (e) {
    console.error("Edit request error:", e);
    setToast({ open: true, text: "Network error: Could not send request" });
  }
};

  // Open themed confirm dialog for delete
  const handleDelete = (id, eventType) => {
    const typeLabel =
      eventType.charAt(0).toUpperCase() + eventType.slice(1, -1); // "bazaars" -> "Bazaar"
    setConfirm({
      open: true,
      title: `Delete this ${typeLabel.toLowerCase()}?`,
      body: `Are you sure you want to delete this ${typeLabel.toLowerCase()}? This action cannot be undone.`,
      onConfirm: () => doDelete(id, eventType),
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    });
  };
  // Open themed confirm dialog for accept
  const handleAccept = (id) => {
    setConfirm({
      open: true,
      title: `Accept and Publish this workshop?`,
      body: `Are you sure you want to accept and publish this workshop?`,
      onConfirm: () => doUpdateStatus(id, "published"),
      confirmLabel: "Accept & Publish",
      cancelLabel: "Cancel",
    });
  };
  // Open themed confirm dialog for reject
  const handleReject = (id) => {
    setConfirm({
      open: true,
      title: `Reject this workshop?`,
      body: `Are you sure you want to reject this workshop? This action cannot be undone.`,
      onConfirm: () => doUpdateStatus(id, "rejected"),
      confirmLabel: "Reject",
      cancelLabel: "Cancel",
    });
  };
  // Open edit request modal
  const handleRequestEdits = (id) => {
    setEditRequest({
      open: true,
      workshopId: id,
      message: "",
    });
  };
  return (
    <div className="events-theme events-home">
      <div className="container">
        <NavBar bleed />
        <header className="eo-pagehead-simple">
          <h1>Manage and organize all GUC events.</h1>
        </header>
        <div className="eo-search" style={{ margin: "12px 0" }}>
  <input
    type="text"
    placeholder="Search events..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full md:w-1/3 p-2 border border-gray-300 rounded"
  />
</div>

        {/* Filter pills */}
        <div className="eo-filters">
          {["all", "bazaars", "trips", "conferences", "workshops"].map((f) => (
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
        {/* Quick links */}
        {filter === "all" && (
          <div style={{ margin: "24px 0" }}>
            <button
              className="btn"
              onClick={() => navigate("/vendor-requests-booths")}
            >
              Vendor Requests Booth
            </button>
            <button
              className="btn"
              onClick={() => navigate("/gym-manager")}
              style={{ marginLeft: "12px" }}
            >
              Create Gym Session
            </button>
          </div>
        )}
        <h1 className="eo-section-title">
          {filter === "all" ? "All Events" : `${filter[0].toUpperCase() + filter.slice(1)}`}
        </h1>
        
        {loading ? (
          <div className="empty">Loading…</div>
        ) : (
          <div className="grid">
            {filteredEvents.length === 0 && (
              <div className="empty">
                No {filter !== "all" ? filter : "events"} yet.
                {filter !== "all" && CARDS.some((c) => c.type === filter) ? " Create one above." : ""}
              </div>
            )}
            {filteredEvents.map((ev) => {
              const id = ev._id || ev.id;
              const typeRaw = String(ev.type || "").toUpperCase();
              const isBazaar = typeRaw === "BAZAAR";
              const isTrip = typeRaw === "TRIP";
              const isConference = typeRaw === "CONFERENCE";
              const isWorkshop = typeRaw === "WORKSHOP";
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
                  {/* Workshop-specific fields */}
                  {isWorkshop && ev.registrationDeadline && (
                    <div className="kv kv-date">
                      <span className="k">Registration Deadline:</span>
                      <span className="v">
                        {formatDate(ev.registrationDeadline)}
                      </span>
                    </div>
                  )}
                  {isWorkshop && (
                    <div className="kv">
                      <span className="k">Capacity:</span>
                      <span className="v">{ev.capacity ?? "—"}</span>
                    </div>
                  )}
                  {isWorkshop && (
                    <div className="kv">
                      <span className="k">Budget:</span>
                      <span className="v">{formatMoney(ev.requiredBudget)}</span>
                    </div>
                  )}
                  {isWorkshop && (
                    <div className="kv">
                      <span className="k">Status:</span>
                      <span className="v">{ev.status}</span>
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
                  {/* ACTIONS */}
                  <div
                    className="actions"
                    style={{ position: "relative", zIndex: 2 }}
                  >
                    {isBazaar ? (
                      <div
                        className="actions-wrap"
                        style={{ position: "relative", zIndex: 2 }}
                      >
                        {/* Row 1: Edit + Delete */}
                        <div className="actions-row">
                          {editable ? (
                            <Link className="btn" to={`/bazaars/${id}`}>
                              Edit
                            </Link>
                          ) : (
                            <button className="btn btn-disabled" disabled>
                              Edit
                            </button>
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
                        </div>

                        {/* Row 2: Vendor Requests */}
                        <div className="actions-row">
                          {editable ? (
                            <Link
                              className="btn"
                              to={`/bazaars/${id}/vendor-requests`}
                            >
                              Vendor Requests
                            </Link>
                          ) : (
                            <button className="btn btn-disabled" disabled>
                              Vendor Requests
                            </button>
                          )}
                        </div>
                      </div>
                    ) : isTrip ? (
                      <div className="actions-row">
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
                      </div>
                    ) : isConference ? (
                      <div className="actions-row">
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
                      </div>
                    ) : isWorkshop ? (
                      <>
                        {(ev.status === "pending" || ev.status === "edits_requested") && (
                          <>
                            <button
                              className="btn btn-success"
                              onClick={() => handleAccept(id)}
                            >
                              Accept & Publish
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleReject(id)}
                            >
                              Reject
                            </button>
                            <button
                              className="btn btn-warning"
                              onClick={() => handleRequestEdits(id)}
                            >
                              Request Edits
                            </button>
                          </>
                        )}
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

      {/* Edit request modal */}
      {editRequest.open && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm">
            <h2>Request Edits</h2>
            <p>Enter your message for the professor:</p>
            <textarea
              value={editRequest.message}
              onChange={(e) => setEditRequest({ ...editRequest, message: e.target.value })}
              className="w-full h-32 p-2 border border-gray-300 rounded"
              placeholder="Describe the required edits..."
            />
            <div className="confirm-actions">
              <button
                className="btn btn-outline"
                onClick={() => setEditRequest({ open: false, workshopId: null, message: "" })}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={doRequestEdits}
                disabled={!editRequest.message.trim()}
              >
                Send
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
