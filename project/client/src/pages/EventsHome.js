import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Search } from "lucide-react";

import workshopPlaceholder from "../images/workshop.png";
import boothPlaceholder from "../images/booth.jpg";

import { workshopAPI } from "../api/workshopApi";
import { boothAPI } from "../api/boothApi";
import { useServerEvents } from "../hooks/useServerEvents";
import Sidebar from "../components/Sidebar";
import { useSearchParams } from "react-router-dom";

// --- helpers (put above the component) ---
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

// editable if the event hasn't started yet
function isEditable(startIso) {
  if (!startIso) return true;
  return new Date(startIso).getTime() > Date.now();
}

export default function EventsHome() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [params] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [chooseOpen, setChooseOpen] = useState(false);
  const [chosenType, setChosenType] = useState("");

  const [workshops, setWorkshops] = useState([]);
  const [booths, setBooths] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState({ open: false, text: "" });
  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    body: "",
    onConfirm: null,
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
  });
  const [editRequest, setEditRequest] = useState({
    open: false,
    workshopId: null,
    message: "",
  });

  const {
    events: otherEvents,
    loading: otherLoading,
    refresh: refreshEvents,
  } = useServerEvents({
    refreshMs: 0,
  });

  const fetchWorkshops = useCallback(async () => {
    try {
      const data = await workshopAPI.getAllWorkshops();
      const normalized = data.map((w) => ({
        _id: w._id,
        title: w.workshopName,
        description: w.shortDescription || w.description || "",
        location: w.location || "",
        startDateTime: w.startDate,
        endDateTime: w.endDate,
        registrationDeadline: w.registrationDeadline,
        capacity: w.capacity,
        budget: w.budget,
        status: w.status,
        registrations: w.registeredUsers || [],
        type: "WORKSHOP",
        image: w.image || workshopPlaceholder,
      }));
      setWorkshops(normalized);
    } catch (err) {
      console.error("Error fetching workshops:", err);
      setToast({ open: true, text: "Failed to load workshops" });
    }
  }, []);

  const fetchBooths = useCallback(async () => {
    try {
      const data = await boothAPI.getAllBooths();
      const normalized = data.map((b) => ({
        _id: b._id,
        title: b.name || `Booth ${b._id}`,
        description: b.description || "",
        startDateTime: b.startDate,
        endDateTime: b.endDate,
        boothSize: b.boothSize,
        duration: b.duration,
        platformSlot: b.platformSlot,
        status: b.status,
        attendees: b.attendees,
        type: "BOOTH",
        image: b.image || boothPlaceholder,
      }));
      setBooths(normalized);
    } catch (err) {
      console.error("Error fetching booths:", err);
      setToast({ open: true, text: "Failed to load booths" });
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchWorkshops(), fetchBooths()]).finally(() =>
      setLoading(false)
    );
  }, [fetchWorkshops, fetchBooths]);

  const refreshAll = useCallback(() => {
    fetchWorkshops();
    fetchBooths();
    refreshEvents();
  }, [fetchWorkshops, fetchBooths, refreshEvents]);

  const allEvents = [
    ...otherEvents.filter((e) => !e.status || e.status === "published"),
    ...workshops,
    ...booths,
  ];

  const isLoading = loading || otherLoading;

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) navigate("/");
  };

  // ====== API actions ======
  const doDelete = async (id, eventType) => {
    try {
      const res = await fetch(`/api/${eventType}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setToast({ open: true, text: err.error || "Failed to delete" });
        return;
      }
      setToast({ open: true, text: "Event deleted successfully!" });
      refreshAll();
    } catch (e) {
      console.error("Delete error:", e);
      setToast({ open: true, text: "Network error: Could not delete" });
    }
  };

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
      refreshAll();
    } catch (e) {
      console.error("Update error:", e);
      setToast({ open: true, text: "Network error: Could not update" });
    }
  };

  const doRequestEdits = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/workshops/${editRequest.workshopId}/request-edits`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: editRequest.message }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setToast({ open: true, text: err.error || "Failed to send request" });
        return;
      }
      setToast({ open: true, text: "Edit request sent successfully!" });
      setEditRequest({ open: false, workshopId: null, message: "" });
      refreshAll();
    } catch (e) {
      console.error("Edit request error:", e);
      setToast({ open: true, text: "Network error: Could not send request" });
    }
  };

  // ====== Handlers for modals & buttons ======
  const handleDelete = (id, eventType) => {
    const label =
      eventType.charAt(0).toUpperCase() + eventType.slice(1, -1).toLowerCase();
    setConfirm({
      open: true,
      title: `Delete this ${label}?`,
      body: `Are you sure you want to delete this ${label}? This action cannot be undone.`,
      onConfirm: () => doDelete(id, eventType),
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    });
  };

  const handleAccept = (id) => {
    setConfirm({
      open: true,
      title: "Accept and publish this workshop?",
      body: "Are you sure you want to accept and publish this workshop?",
      onConfirm: () => doUpdateStatus(id, "published"),
      confirmLabel: "Accept & Publish",
      cancelLabel: "Cancel",
    });
  };

  const handleReject = (id) => {
    setConfirm({
      open: true,
      title: "Reject this workshop?",
      body: "Are you sure you want to reject this workshop? This action cannot be undone.",
      onConfirm: () => doUpdateStatus(id, "rejected"),
      confirmLabel: "Reject",
      cancelLabel: "Cancel",
    });
  };

  const handleRequestEdits = (id) => {
    setEditRequest({
      open: true,
      workshopId: id,
      message: "",
    });
  };
  /* ----------------------------------------------------
   1) FIRST: FILTER EVENTS
---------------------------------------------------- */
  const filteredEvents = allEvents.filter((ev) => {
    const title = ev.title?.toLowerCase() || "";
    const matchSearch = title.includes(searchTerm.toLowerCase());
    const matchType = filter === "All" || ev.type === filter;
    return matchSearch && matchType;
  });
  useEffect(() => {
    const urlFilter = params.get("filter");
    if (urlFilter) {
      setFilter(urlFilter);
    } else {
      setFilter("All");
    }
  }, [params]);

  /* ----------------------------------------------------
   2) THEN: PAGINATION
---------------------------------------------------- */
  const ITEMS_PER_PAGE = 6; // change number if you want more per page
  const indexOfLast = currentPage * ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - ITEMS_PER_PAGE;
  const currentEvents = filteredEvents.slice(indexOfFirst, indexOfLast);

  /* ----------------------------------------------------
   3) NUMBER OF PAGES
---------------------------------------------------- */
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);

  return (
    <div
      className="events-theme"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      {/* ==================== FIXED SIDEBAR ==================== */}
      <Sidebar filter={filter} setFilter={setFilter} />

      {/* ==================== MAIN AREA ==================== */}
      <main style={{ flex: 1, marginLeft: "260px", padding: "0 24px 24px" }}>
        {/* ---- Top Search & Info Bar ---- */}
        <header
          style={{
            marginLeft: "-24px",
            marginRight: "-24px",
            width: "calc(100% + 48px)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--card)",
            borderRadius: "0 0 16px 16px",
            boxShadow: "var(--shadow)",
            padding: "10px 20px",
            marginBottom: "20px",
            position: "sticky",
            top: 0,
            zIndex: 5,
          }}
        >
          {/* LEFT: search + filter */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ position: "relative", width: "620px" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "10px",
                  transform: "translateY(-50%)",
                  color: "var(--teal)",
                }}
              />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 34px",
                  borderRadius: "10px",
                  border: "1px solid rgba(47,65,86,0.2)",
                  fontSize: "13px",
                }}
              />
            </div>
          </div>

          {/* RIGHT: action buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="btn"
              style={{
                background: "var(--teal)",
                color: "white",
                borderRadius: "10px",
                fontWeight: "700",
                padding: "8px 14px",
              }}
              onClick={() => setChooseOpen(true)}
            >
              Create Event
            </button>

            <button
              className="btn"
              style={{
                background: "var(--teal)",
                color: "white",
                borderRadius: "10px",
                fontWeight: "700",
                padding: "8px 14px",
              }}
              onClick={() => navigate("/gym-manager")}
            >
              Create Gym
            </button>
            {chooseOpen && (
              <div
                className="confirm-overlay"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    background: "white",
                    padding: "20px",
                    borderRadius: "12px",
                    width: "320px",
                    boxShadow: "var(--shadow)",
                  }}
                >
                  <h3 style={{ marginBottom: "15px", textAlign: "center" }}>
                    Select Event Type
                  </h3>

                  <select
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      marginBottom: "15px",
                    }}
                    value={chosenType}
                    onChange={(e) => setChosenType(e.target.value)}
                  >
                    <option value="">-- choose --</option>
                    <option value="bazaar">Bazaar</option>
                    <option value="conference">Conference</option>
                    <option value="trip">Trip</option>
                  </select>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      className="btn btn-outline"
                      style={{ flex: 1 }}
                      onClick={() => setChooseOpen(false)}
                    >
                      Cancel
                    </button>

                    <button
                      className="btn"
                      style={{ flex: 1 }}
                      onClick={() => {
                        if (!chosenType) return alert("Pick a type");

                        if (chosenType === "bazaar")
                          navigate("/bazaars/create");
                        if (chosenType === "conference")
                          navigate("/conferences/create");
                        if (chosenType === "trip") navigate("/trips/create");
                      }}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ---- Welcome & Overview ---- */}
        {/* ---- Welcome + Pagination Row ---- */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "-26px",
            marginBottom: "16px",
            width: "100%",
          }}
        >
          {/* LEFT: Welcome text */}
          <div>
            <h1
              style={{
                color: "var(--navy)",
                fontWeight: 800,
                marginBottom: "4px",
              }}
            >
              Welcome back, Events Office 👋
            </h1>

            <p
              className="eo-sub"
              style={{
                marginTop: 0,
                marginBottom: 0,
              }}
            >
              Manage and organize all GUC events.
            </p>
          </div>

          {/* RIGHT: Pagination next to welcome */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* LEFT ARROW */}
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              className="pg-btn arrow"
            >
              ‹
            </button>

            {/* CURRENT PAGE */}
            <div className="pg-btn current">{currentPage}</div>

            {/* RIGHT ARROW */}
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              className="pg-btn arrow"
            >
              ›
            </button>
          </div>
        </div>

        {/* ---- Main Events Grid ---- */}
        {isLoading ? (
          <p style={{ color: "var(--text-muted)", marginTop: "40px" }}>
            Loading events...
          </p>
        ) : filteredEvents.length === 0 ? (
          <p style={{ color: "var(--text-muted)", marginTop: "40px" }}>
            No events found.
          </p>
        ) : (
          <div className="grid">
            {currentEvents.map((ev) => {
              const id = ev._id;
              const typeRaw = ev.type?.toUpperCase() || "EVENT";
              const title = ev.title || ev.name || "Untitled";
              const editable = isEditable(ev.startDateTime);

              const isWorkshop = typeRaw === "WORKSHOP";
              const isBooth = typeRaw === "BOOTH";
              const isBazaar = typeRaw === "BAZAAR";
              const isTrip = typeRaw === "TRIP";
              const isConference = typeRaw === "CONFERENCE";

              return (
                <article key={id} className="card">
                  <div className="chip">{typeRaw}</div>

                  {/* NAME */}
                  <div className="kv">
                    <span className="k">Name:</span>
                    <span className="v">{title}</span>
                  </div>

                  {/* LOCATION */}
                  {ev.location && (
                    <div className="kv">
                      <span className="k">Location:</span>
                      <span className="v">{ev.location}</span>
                    </div>
                  )}

                  {/* START */}
                  {ev.startDateTime && (
                    <div className="kv kv-date">
                      <span className="k">Starts:</span>
                      <span className="v">{formatDate(ev.startDateTime)}</span>
                    </div>
                  )}

                  {/* END */}
                  {ev.endDateTime && (
                    <div className="kv kv-date">
                      <span className="k">Ends:</span>
                      <span className="v">{formatDate(ev.endDateTime)}</span>
                    </div>
                  )}

                  {/* ========================= WORKSHOP FIELDS ========================= */}
                  {isWorkshop && (
                    <>
                      {ev.registrationDeadline && (
                        <div className="kv kv-date">
                          <span className="k">Registration Deadline:</span>
                          <span className="v">
                            {formatDate(ev.registrationDeadline)}
                          </span>
                        </div>
                      )}

                      <div className="kv">
                        <span className="k">Capacity:</span>
                        <span className="v">{ev.capacity ?? "—"}</span>
                      </div>

                      <div className="kv">
                        <span className="k">Budget:</span>
                        <span className="v">{formatMoney(ev.budget)}</span>
                      </div>

                      <div className="kv">
                        <span className="k">Status:</span>
                        <span className="v">{ev.status}</span>
                      </div>

                      {ev.registrations?.length > 0 && (
                        <div className="kv">
                          <span className="k">Registered:</span>
                          <span className="v">
                            {ev.registrations.length} participants
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* ========================= BOOTH FIELDS ========================= */}
                  {isBooth && (
                    <>
                      <div className="kv">
                        <span className="k">Booth Size:</span>
                        <span className="v">{ev.boothSize || "—"}</span>
                      </div>
                      <div className="kv">
                        <span className="k">Duration:</span>
                        <span className="v">
                          {ev.duration || ev.durationWeeks} week(s)
                        </span>
                      </div>
                      <div className="kv">
                        <span className="k">Platform Slot:</span>
                        <span className="v">{ev.platformSlot || "—"}</span>
                      </div>
                      <div className="kv">
                        <span className="k">Status:</span>
                        <span className="v">{ev.status || "—"}</span>
                      </div>
                      {Array.isArray(ev.attendees) &&
                        ev.attendees.length > 0 && (
                          <div className="kv">
                            <span className="k">Attendees:</span>
                            <span className="v">
                              {ev.attendees.map((a) => a.name || a).join(", ")}
                            </span>
                          </div>
                        )}
                    </>
                  )}

                  {/* ========================= BAZAAR FIELDS ========================= */}
                  {isBazaar && (
                    <>
                      {ev.registrationDeadline && (
                        <div className="kv kv-date">
                          <span className="k">Registration Deadline:</span>
                          <span className="v">
                            {formatDate(ev.registrationDeadline)}
                          </span>
                        </div>
                      )}
                      {ev.registrations?.length > 0 && (
                        <div className="kv">
                          <span className="k">Registered:</span>
                          <span className="v">
                            {ev.registrations.length} participants
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* ========================= CONFERENCE FIELDS ========================= */}
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

                  {/* ========================= TRIP FIELDS ========================= */}
                  {isTrip && (
                    <>
                      {ev.price && (
                        <div className="kv">
                          <span className="k">Price:</span>
                          <span className="v">{formatMoney(ev.price)}</span>
                        </div>
                      )}
                      {ev.capacity && (
                        <div className="kv">
                          <span className="k">Capacity:</span>
                          <span className="v">{ev.capacity}</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* ========================= DESCRIPTION ========================= */}
                  {(ev.description || ev.shortDescription) && (
                    <p
                      style={{
                        marginTop: "8px",
                        fontSize: "14px",
                        lineHeight: "1.4",
                        color: "var(--text-normal)",
                      }}
                    >
                      {ev.description || ev.shortDescription}
                    </p>
                  )}

                  {/* ========================= ACTION BUTTONS ========================= */}
                  <div className="actions" style={{ marginTop: "12px" }}>
                    {/* ------ BAZAAR ------ */}
                    {isBazaar && (
                      <>
                        {editable ? (
                          <button
                            className="btn"
                            onClick={() => navigate(`/bazaars/${id}`)}
                          >
                            Edit
                          </button>
                        ) : (
                          <button className="btn btn-disabled" disabled>
                            Edit
                          </button>
                        )}

                        <button
                          className="btn btn-danger"
                          disabled={ev.registrations?.length > 0}
                          onClick={() => handleDelete(id, "bazaars")}
                          title={
                            ev.registrations?.length > 0
                              ? "Cannot delete: participants registered"
                              : "Delete this bazaar"
                          }
                        >
                          Delete
                        </button>

                        <button
                          className="btn"
                          style={{ background: "var(--teal)", color: "white" }}
                          onClick={() =>
                            navigate(`/bazaars/${id}/vendor-requests`)
                          }
                        >
                          Vendor Requests
                        </button>
                      </>
                    )}

                    {/* ------ TRIP ------ */}
                    {isTrip && (
                      <>
                        {editable ? (
                          <button
                            className="btn"
                            onClick={() => navigate(`/trips/${id}`)}
                          >
                            Edit
                          </button>
                        ) : (
                          <button className="btn btn-disabled" disabled>
                            Edit
                          </button>
                        )}
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(id, "trips")}
                        >
                          Delete
                        </button>
                      </>
                    )}

                    {/* ------ CONFERENCE ------ */}
                    {isConference && (
                      <>
                        {editable ? (
                          <button
                            className="btn"
                            onClick={() => navigate(`/conferences/${id}`)}
                          >
                            Edit
                          </button>
                        ) : (
                          <button className="btn btn-disabled" disabled>
                            Edit
                          </button>
                        )}
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(id, "conferences")}
                        >
                          Delete
                        </button>
                      </>
                    )}

                    {/* ------ WORKSHOP ------ */}
                    {isWorkshop && (
                      <>
                        {(ev.status === "pending" ||
                          ev.status === "edits_requested") && (
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
                    )}

                    {/* ------ BOOTH ------ */}
                    {isBooth && (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(id, "booths")}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* ===== Confirm Modal ===== */}
      {confirm.open && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm">
            <h2>{confirm.title || "Are you sure?"}</h2>
            <p>{confirm.body}</p>
            <div className="confirm-actions">
              <button
                className="btn btn-outline"
                onClick={() =>
                  setConfirm((c) => ({
                    ...c,
                    open: false,
                  }))
                }
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

      {/* ===== Request Edits Modal ===== */}
      {editRequest.open && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm">
            <h2>Request Edits</h2>
            <p>Enter your message for the professor:</p>
            <textarea
              value={editRequest.message}
              onChange={(e) =>
                setEditRequest({ ...editRequest, message: e.target.value })
              }
              className="w-full h-32 p-2 border border-gray-300 rounded"
              placeholder="Describe the required edits..."
            />
            <div className="confirm-actions">
              <button
                className="btn btn-outline"
                onClick={() =>
                  setEditRequest({ open: false, workshopId: null, message: "" })
                }
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

      {/* ===== Toast ===== */}
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
