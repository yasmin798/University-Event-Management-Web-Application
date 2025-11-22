// client/src/pages/EventsHome.js
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";

import workshopPlaceholder from "../images/workshop.png";
import boothPlaceholder from "../images/booth.jpg";
import { workshopAPI } from "../api/workshopApi";
import { boothAPI } from "../api/boothApi";
import { useServerEvents } from "../hooks/useServerEvents";
import Sidebar from "../components/Sidebar";

import conferenceImg from "../images/Conferenceroommeetingconcept.jpeg";
import tripImg from "../images/Womanlookingatmapplanningtrip.jpeg";
import bazaarImg from "../images/Arabbazaarisolatedonwhitebackground_FreeVector.jpeg";
import workshopImg from "../images/download(12).jpeg";

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
  const [viewEvent, setViewEvent] = useState(null);

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

  const exportAttendees = async (eventId, eventType) => {
    if (!eventId) return;

    const typeMap = {
      bazaars: "bazaars",
      trips: "trips",
      workshops: "workshops",
      booths: "booths",
    };

    const apiPath = typeMap[eventType];
    if (!apiPath) {
      setToast({ open: true, text: "Export not supported" });
      return;
    }

    try {
      const res = await fetch(
        `/api/events/${eventId}/registrations?format=xlsx`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!res.ok) {
        const err = await res.text();
        setToast({ open: true, text: err || "Export failed" });
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendees_${eventType}_${eventId}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      setToast({ open: true, text: "Exported successfully!" });
    } catch (e) {
      setToast({ open: true, text: "Export error" });
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
  const ITEMS_PER_PAGE = 6;
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
              Welcome back, Events Office
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
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              className="pg-btn arrow"
            >
              ‹
            </button>
            <div className="pg-btn current">{currentPage}</div>
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "24px",
              alignItems: "stretch",
            }}
          >
            {currentEvents.map((ev) => {
              let cardImage = workshopImg;
              if (ev.type === "TRIP") cardImage = tripImg;
              if (ev.type === "BAZAAR") cardImage = bazaarImg;
              if (ev.type === "CONFERENCE") cardImage = conferenceImg;
              if (ev.type === "WORKSHOP") cardImage = workshopImg;

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
                <article
                  key={id}
                  className="card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    height: "430px", // 🔥 all cards same height
                  }}
                >
                  {/* TOP CONTENT */}
                  <div style={{ flexGrow: 1 }}>
                    <img
                      src={cardImage}
                      alt={ev.title}
                      style={{
                        width: "100%",
                        height: "150px",
                        objectFit: "cover",
                        borderRadius: "12px",
                        marginBottom: "12px",
                      }}
                    />

                    <div className="chip">{typeRaw}</div>

                    {/* NAME ONLY on card */}
                    <div className="kv">
                      <span className="k">Name:</span>
                      <span className="v">{title}</span>
                    </div>
                  </div>

                  {/* ========================= ACTION BUTTONS ========================= */}
                  <div
                    className="actions"
                    style={{
                      marginTop: "12px",
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* BAZAAR */}
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
                        {/* VIEW + EXPORT */}
                        <button
                          className="btn btn-outline"
                          onClick={() => setViewEvent(ev)}
                        >
                          View Details
                        </button>
                        <button
                          className="btn"
                          style={{ background: "#c88585", color: "white" }}
                          onClick={() => exportAttendees(id, "bazaars")}
                        >
                          Export Excel
                        </button>
                      </>
                    )}

                    {/* TRIP */}
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
                        {/* VIEW + EXPORT */}
                        <button
                          className="btn btn-outline"
                          onClick={() => setViewEvent(ev)}
                        >
                          View Details
                        </button>
                        <button
                          className="btn"
                          style={{ background: "#c88585", color: "white" }}
                          onClick={() => exportAttendees(id, "trips")}
                        >
                          Export Excel
                        </button>
                      </>
                    )}

                    {/* CONFERENCE */}
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
                        {/* VIEW ONLY (no export here in your code) */}
                        <button
                          className="btn btn-outline"
                          onClick={() => setViewEvent(ev)}
                        >
                          View Details
                        </button>
                      </>
                    )}

                    {/* WORKSHOP */}
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
                        {/* VIEW ALWAYS */}
                        <button
                          className="btn btn-outline"
                          onClick={() => setViewEvent(ev)}
                        >
                          View Details
                        </button>
                        {ev.status === "published" && (
                          <button
                            className="btn"
                            style={{ background: "#c88585", color: "white" }}
                            onClick={() => exportAttendees(id, "workshops")}
                          >
                            Export Excel
                          </button>
                        )}
                      </>
                    )}

                    {/* BOOTH */}
                    {isBooth && (
                      <>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(id, "booths")}
                        >
                          Delete
                        </button>
                        {/* VIEW + EXPORT */}
                        <button
                          className="btn btn-outline"
                          onClick={() => setViewEvent(ev)}
                        >
                          View Details
                        </button>
                        <button
                          className="btn"
                          style={{ background: "#c88585", color: "white" }}
                          onClick={() => exportAttendees(id, "booths")}
                        >
                          Export Excel
                        </button>
                      </>
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

      {/* ===== VIEW DETAILS MODAL ===== */}
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
              {viewEvent.title || viewEvent.name}
            </h2>

            {viewEvent.type && (
              <div style={{ marginBottom: "10px" }}>
                <strong>Type:</strong> {viewEvent.type}
              </div>
            )}

            {viewEvent.location && (
              <div style={{ marginBottom: "10px" }}>
                <strong>Location:</strong> {viewEvent.location}
              </div>
            )}

            {viewEvent.startDateTime && (
              <div style={{ marginBottom: "10px" }}>
                <strong>Starts:</strong> {formatDate(viewEvent.startDateTime)}
              </div>
            )}

            {viewEvent.endDateTime && (
              <div style={{ marginBottom: "10px" }}>
                <strong>Ends:</strong> {formatDate(viewEvent.endDateTime)}
              </div>
            )}

            {viewEvent.registrationDeadline && (
              <div style={{ marginBottom: "10px" }}>
                <strong>Registration Deadline:</strong>{" "}
                {formatDate(viewEvent.registrationDeadline)}
              </div>
            )}

            {viewEvent.capacity && (
              <div style={{ marginBottom: "10px" }}>
                <strong>Capacity:</strong> {viewEvent.capacity}
              </div>
            )}

            {viewEvent.boothSize && (
              <div style={{ marginBottom: "10px" }}>
                <strong>Booth Size:</strong> {viewEvent.boothSize}
              </div>
            )}

            {viewEvent.duration && (
              <div style={{ marginBottom: "10px" }}>
                <strong>Duration:</strong> {viewEvent.duration}
              </div>
            )}

            {viewEvent.platformSlot && (
              <div style={{ marginBottom: "10px" }}>
                <strong>Platform Slot:</strong> {viewEvent.platformSlot}
              </div>
            )}

            {viewEvent.price && (
              <div style={{ marginBottom: "10px" }}>
                <strong>Price:</strong> {formatMoney(viewEvent.price)}
              </div>
            )}

            {viewEvent.budget && (
              <div style={{ marginBottom: "10px" }}>
                <strong>Budget:</strong> {formatMoney(viewEvent.budget)}
              </div>
            )}

            {viewEvent.status && (
              <div style={{ marginBottom: "10px" }}>
                <strong>Status:</strong> {viewEvent.status}
              </div>
            )}

            {viewEvent.registrations && viewEvent.registrations.length > 0 && (
              <div style={{ marginBottom: "10px" }}>
                <strong>Registered Participants:</strong>{" "}
                {viewEvent.registrations.length}
              </div>
            )}

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
  );
}
