// client/src/pages/EventsHome.js
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import NotificationsDropdown from "../components/NotificationsDropdown";

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

// Check if an event has already ended
function isPastEvent(ev) {
  const endDate = ev.endDateTime || ev.endDate;
  // support all types
  if (!endDate) return false;
  return new Date(endDate).getTime() < Date.now();
}
// shared style for "Create Event / Gym / Poll" buttons
// shared style for "Create Event / Gym / Poll" buttons
const topActionBtnStyle = {
  background: "var(--teal)",
  color: "white",
  borderRadius: "10px",
  padding: "10px 18px", // a bit taller & wider (optional)
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontSize: "16px", // ⬅⬅ make font bigger
  minWidth: "120px",
  textAlign: "center",
};

export default function EventsHome() {
  const navigate = useNavigate();
  const [viewEvent, setViewEvent] = useState(null);
  const [conferences, setConferences] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [dateFilter, setDateFilter] = useState("");
  const [filter, setFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("asc");
  const [params] = useSearchParams();

  // Debounced filters
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  const [debouncedDate, setDebouncedDate] = useState(dateFilter);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedDate(dateFilter), 300);
    return () => clearTimeout(t);
  }, [dateFilter]);
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
        title: w.workshopName || w.title,
        type: "WORKSHOP",

        // WORKSHOP FIELDS
        location: w.location,
        startDateTime: w.startDateTime, // ← REAL BACKEND FIELD
        endDateTime: w.endDateTime, // ← REAL BACKEND FIELD
        registrationDeadline: w.registrationDeadline,
        capacity: w.capacity,

        description: w.shortDescription || "",
        agenda: w.fullAgenda || w.agenda,
        facultyResponsible: w.facultyResponsible,
        professorsParticipating: w.professorsParticipating,
        budget: w.requiredBudget || w.budget,
        fundingSource: w.fundingSource,
        extraResources: w.extraResources,

        status: w.status,
        registrations: w.registeredUsers || [],
        image: w.image || workshopPlaceholder,
      }));
      const normalizedConferences = otherEvents
        .filter((ev) => ev.type === "CONFERENCE")
        .map((c) => ({
          _id: c._id,
          type: "CONFERENCE",

          title: c.name || c.title,
          name: c.name || c.title,

          location: c.location,
          startDateTime: c.startDateTime, // ← correct backend field
          endDateTime: c.endDateTime, // ← correct backend field

          shortDescription: c.shortDescription,
          description: c.shortDescription, // for view modal fallback

          agenda: c.fullAgenda || c.agenda,
          website: c.website,

          budget: c.requiredBudget || c.budget,
          fundingSource: c.fundingSource,
          extraResources: c.extraResources,

          registrations: c.registeredUsers || [],
          status: c.status,

          image: conferenceImg,
        }));
      setConferences(normalizedConferences);

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
        title: b.attendees?.[0]?.name || `Booth ${b._id}`,

        description: b.description || "",
        startDateTime: b.startDate,
        endDateTime: b.endDate,
        boothSize: b.boothSize,
        duration: b.durationWeeks,

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
  function normalizeConferenceFields(conf) {
    return {
      ...conf,
      shortDescription: conf.shortDescription || "",
      fullAgenda: conf.fullAgenda || "",
      website: conf.website || "",
      requiredBudget: conf.requiredBudget || "",
      fundingSource: conf.fundingSource || "",
      extraResources: conf.extraResources || "",
    };
  }

  const allEvents = [
    ...otherEvents.filter((e) => !["CONFERENCE"].includes(e.type)),
    ...conferences,
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

  // Generic Archive Button for any event type
async function handleArchive(id, type) {
  // Get user role from localStorage
  const userRole = localStorage.getItem("role");

  // Only allow EVENTS_OFFICE to archive
  if (userRole !== "EVENTS_OFFICE") {
    return alert("You do not have permission to archive this item.");
  }

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/${type}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "archived" }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return alert("Failed to archive: " + errorText);
    }

    const data = await res.json();
    alert(data.message);

    // Update UI immediately if needed
    // e.g., refetch events or update local state
  } catch (err) {
    console.error(err);
    alert("Failed to archive: Network error");
  }
}



  /* ----------------------------------------------------
   1) FIRST: FILTER EVENTS
  ---------------------------------------------------- */
  const filteredEvents = allEvents
    .filter((ev) => {
      const title = ev.title?.toLowerCase() || "";
      const professors = ev.professorsParticipating?.toLowerCase() || "";
      const location = ev.location?.toLowerCase() || "";

      const term = debouncedSearch.toLowerCase();

      const matchSearch =
        !term ||
        title.includes(term) ||
        professors.includes(term) ||
        location.includes(term);

      const matchType = filter === "All" || ev.type === filter;
      const matchDate =
        !debouncedDate ||
        (ev.startDateTime && ev.startDateTime.slice(0, 10) === debouncedDate);

      return matchSearch && matchType && matchDate;
    })
    .sort((a, b) => {
      const dateA = new Date(a.startDateTime || a.startDate || a.date);
      const dateB = new Date(b.startDateTime || b.startDate || b.date);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
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
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ position: "relative", width: "260px" }}>
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
                placeholder="Search by title, professor, location"
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

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                width: "120px",
                padding: "6px 10px",
                borderRadius: "10px",
                border: "1px solid rgba(47,65,86,0.2)",
                fontSize: "13px",
              }}
            />

            <button
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
              style={{
                padding: "6px 10px",
                borderRadius: "10px",
                border: "1px solid rgba(47,65,86,0.2)",
                background: "white",
                fontSize: "13px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Sort {sortOrder === "asc" ? "Oldest" : "Newest"}
            </button>
          </div>

          {/* RIGHT: action buttons */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {/* Notifications dropdown */}
            <div>
              <React.Suspense fallback={null}>
                <NotificationsDropdown />
              </React.Suspense>
            </div>

            <button
              style={topActionBtnStyle}
              onClick={() => setChooseOpen(true)}
            >
              Create Event
            </button>

            <button
              style={topActionBtnStyle}
              onClick={() => navigate("/gym-manager")}
            >
              Create Gym
            </button>

            <button
              style={topActionBtnStyle}
              onClick={() => navigate("/create-poll")}
            >
              Create Poll
            </button>
          </div>
          <div>
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
              const archived = isPastEvent(ev); // true if the event has already ended
              const isWorkshop = typeRaw === "WORKSHOP";
              const isBooth = typeRaw === "BOOTH";
              const isBazaar = ev.type?.toLowerCase() === "bazaar";

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
    <button className="btn btn-outline" onClick={() => setViewEvent(ev)}>
      View Details
    </button>

    {/* MANUAL ARCHIVE BUTTON — only for past events */}
    {isPastEvent(ev) && ev.status !== "archived" && (
      <button
        className="btn"
        style={{ background: "#8B4513", color: "white" }}
        onClick={async () => {
          try {
            const typeMap = {
              TRIP: "trips",
              BAZAAR: "bazaars",
              CONFERENCE: "conferences",
              WORKSHOP: "workshops",
              BOOTH: "booths",
            };

            const path = typeMap[ev.type.toUpperCase()];
            if (!path) return alert("Unknown event type: " + ev.type);

            const token = localStorage.getItem("token"); // adjust if using context
            const res = await fetch(`/api/${path}/${ev._id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ status: "archived" }),
            });

            if (!res.ok) {
              const errorText = await res.text();
              return alert("Failed to archive: " + errorText);
            }

            // Update local state so UI reflects immediately
            ev.status = "archived";
            alert("Event archived successfully!");
          } catch (err) {
            console.error(err);
            alert("Failed to archive: Network error");
          }
        }}
      >
        Archive
      </button>
    )}

    {editable && ev.status !== "archived" ? (
      <button className="btn" onClick={() => navigate(`/bazaars/${ev._id}`)}>
        Edit
      </button>
    ) : (
      <button className="btn btn-disabled" disabled>
        Edit
      </button>
    )}

    <button
      className="btn btn-danger"
      disabled={ev.status === "archived" || ev.registrations?.length > 0}
      onClick={() => handleDelete(ev._id, "bazaars")}
      title={
        ev.registrations?.length > 0
          ? "Cannot delete: participants registered"
          : "Cannot delete archived event"
      }
    >
      Delete
    </button>

    <button
      className="btn"
      onClick={() => navigate(`/bazaars/${ev._id}/vendor-requests`)}
    >
      Vendor Requests
    </button>

    <button
      className="btn"
      style={{ background: "#c88585", color: "white" }}
      onClick={() => exportAttendees(ev._id, "bazaars")}
      disabled={ev.status === "archived"}
    >
      Export Excel
    </button>

    {ev.status === "archived" && (
      <div
        className="chip"
        style={{ background: "#666", color: "white", marginTop: "8px" }}
      >
        ARCHIVED
      </div>
    )}
  </>
)}



                   {/* TRIP */}
{isTrip && (
  <>
    <button className="btn btn-outline" onClick={() => setViewEvent(ev)}>
      View Details
    </button>

    {/* ARCHIVE BUTTON — only shows if trip has passed and not yet archived */}
    {isPastEvent(ev) && ev.status !== "archived" && (
      <button
        className="btn"
        style={{ background: "#8B4513", color: "white" }}
        onClick={async () => {
          try {
            const typeMap = {
              TRIP: "trips",
              BAZAAR: "bazaars",
              CONFERENCE: "conferences",
              WORKSHOP: "workshops",
              BOOTH: "booths",
            };

            const path = typeMap[ev.type.toUpperCase()];
            if (!path) return alert("Unknown event type: " + ev.type);

            const token = localStorage.getItem("token"); // adjust if using context
            const res = await fetch(`/api/${path}/${ev._id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ status: "archived" }),
            });

            if (!res.ok) {
              const errorText = await res.text();
              return alert("Failed to archive: " + errorText);
            }

            // Update local state so UI reflects immediately
            ev.status = "archived";
            alert("Trip archived successfully!");
          } catch (err) {
            console.error(err);
            alert("Failed to archive: Network error");
          }
        }}
      >
        Archive
      </button>
    )}

    {/* Edit button */}
    {editable && ev.status !== "archived" ? (
      <button className="btn" onClick={() => navigate(`/trips/${ev._id}`)}>
        Edit
      </button>
    ) : (
      <button className="btn btn-disabled" disabled>
        Edit
      </button>
    )}

    {/* Delete button */}
    <button
      className="btn btn-danger"
      disabled={ev.status === "archived"}
      onClick={() => handleDelete(ev._id, "trips")}
      title={ev.status === "archived" ? "Cannot delete archived event" : "Delete this trip"}
    >
      Delete
    </button>

    {/* Export Excel */}
    <button
      className="btn"
      style={{ background: "#c88585", color: "white" }}
      onClick={() => exportAttendees(ev._id, "trips")}
      disabled={ev.status === "archived"}
    >
      Export Excel
    </button>

    {/* ARCHIVED badge */}
    {ev.status === "archived" && (
      <div className="chip" style={{ background: "#666", color: "white", marginTop: "8px" }}>
        ARCHIVED
      </div>
    )}
  </>
)}


                   {/* CONFERENCE */}
{isConference && (
  <>
    <button className="btn btn-outline" onClick={() => setViewEvent(ev)}>
      View Details
    </button>

    {/* ARCHIVE BUTTON — only appears if conference has ended and is not yet archived */}
    {isPastEvent(ev) && ev.status !== "archived" && (
      <button
        className="btn"
        style={{ background: "#8B4513", color: "white" }}
        onClick={async () => {
          try {
            const typeMap = {
              TRIP: "trips",
              BAZAAR: "bazaars",
              CONFERENCE: "conferences",
              WORKSHOP: "workshops",
              BOOTH: "booths",
            };

            const path = typeMap[ev.type.toUpperCase()];
            if (!path) return alert("Unknown event type: " + ev.type);

            const token = localStorage.getItem("token"); // adjust if using context
            const res = await fetch(`/api/${path}/${ev._id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ status: "archived" }),
            });

            if (!res.ok) {
              const errorText = await res.text();
              return alert("Failed to archive: " + errorText);
            }

            // Update local state so UI reflects immediately
            ev.status = "archived";
            alert("Conference archived successfully!");
          } catch (err) {
            console.error(err);
            alert("Failed to archive: Network error");
          }
        }}
      >
        Archive
      </button>
    )}

    {/* Edit button */}
    {editable && ev.status !== "archived" ? (
      <button className="btn" onClick={() => navigate(`/conferences/${ev._id}`)}>
        Edit
      </button>
    ) : (
      <button className="btn btn-disabled" disabled>
        Edit
      </button>
    )}

    {/* Delete button */}
    <button
      className="btn btn-danger"
      disabled={ev.status === "archived"}
      onClick={() => handleDelete(ev._id, "conferences")}
      title={ev.status === "archived" ? "Cannot delete archived event" : "Delete this conference"}
    >
      Delete
    </button>

    {/* ARCHIVED badge */}
    {ev.status === "archived" && (
      <div className="chip" style={{ background: "#666", color: "white", marginTop: "8px" }}>
        ARCHIVED
      </div>
    )}
  </>
)}


                   {/* WORKSHOP */}
{isWorkshop && (
  <>
    <button className="btn btn-outline" onClick={() => setViewEvent(ev)}>
      View Details
    </button>

    {/* ARCHIVE BUTTON — only shows if workshop has ended and is NOT archived */}
    {isPastEvent(ev) && ev.status !== "archived" && (
      <button
        className="btn"
        style={{ background: "#8B4513", color: "white" }}
        onClick={async () => {
          try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/workshops/${ev._id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ status: "archived" }),
            });

            if (!res.ok) {
              const errorText = await res.text();
              return alert("Failed to archive: " + errorText);
            }

            // Update status locally
            ev.status = "archived";
            alert("Workshop archived successfully!");
          } catch (err) {
            console.error(err);
            alert("Failed to archive: Network error");
          }
        }}
      >
        Archive
      </button>
    )}

    {/* Accept/Reject/Request Edits — only if NOT archived */}
    {ev.status !== "archived" &&
      (ev.status === "pending" || ev.status === "edits_requested") && (
        <>
          <button className="btn btn-success" onClick={() => handleAccept(id)}>
            Accept & Publish
          </button>
          <button className="btn btn-danger" onClick={() => handleReject(id)}>
            Reject
          </button>
          <button className="btn btn-warning" onClick={() => handleRequestEdits(id)}>
            Request Edits
          </button>
        </>
      )}

    {/* Export Excel — only for published workshops and NOT archived */}
    {ev.status === "published" && ev.status !== "archived" && (
      <button
        className="btn"
        style={{ background: "#c88585", color: "white" }}
        onClick={() => exportAttendees(id, "workshops")}
      >
        Export Excel
      </button>
    )}

    {/* ARCHIVED badge */}
    {ev.status === "archived" && (
      <div className="chip" style={{ background: "#666", color: "white", marginTop: "8px" }}>
        ARCHIVED
      </div>
    )}
  </>
)}


                   {/* BOOTH */}
{isBooth && (
  <>
    <button className="btn btn-outline" onClick={() => setViewEvent(ev)}>
      View Details
    </button>

    {/* ARCHIVE BUTTON — only shows if booth has ended and is NOT archived */}
    {isPastEvent(ev) && ev.status !== "archived" && (
      <button
        className="btn"
        style={{ background: "#8B4513", color: "white" }}
        onClick={async () => {
          try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/booths/${ev._id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ status: "archived" }),
            });

            if (!res.ok) {
              const errorText = await res.text();
              return alert("Failed to archive: " + errorText);
            }

            ev.status = "archived"; // update UI immediately
            alert("Booth archived successfully!");
          } catch (err) {
            console.error(err);
            alert("Failed to archive: Network error");
          }
        }}
      >
        Archive
      </button>
    )}

    {/* Delete — disabled when archived */}
    <button
      className="btn btn-danger"
      disabled={ev.status === "archived"}
      onClick={() => handleDelete(id, "booths")}
    >
      Delete
    </button>

    {/* Export Excel — disabled when archived */}
    <button
      className="btn"
      style={{ background: "#c88585", color: "white" }}
      onClick={() => exportAttendees(id, "booths")}
      disabled={ev.status === "archived"}
    >
      Export Excel
    </button>

    {/* ARCHIVED badge */}
    {ev.status === "archived" && (
      <div className="chip" style={{ background: "#666", color: "white", marginTop: "8px" }}>
        ARCHIVED
      </div>
    )}
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

            {/* ADD THIS BUTTON — SEE ALL REVIEWS */}
            <button
              onClick={() => {
                const reviewsUrl = `/event-reviews/${viewEvent._id}`;
                window.open(reviewsUrl, "_blank");
              }}
              style={{
                position: "absolute",
                top: "10px",
                right: "50px",
                background: "#567c8d",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Ratings & Reviews
            </button>

            <h2 style={{ fontWeight: 800, marginBottom: "10px" }}>
              {viewEvent.title || viewEvent.name}
            </h2>

            {viewEvent.type && (
              <div style={{ marginBottom: "10px" }}>
                <strong>Type:</strong> {viewEvent.type}
              </div>
            )}

            {/* ==================== BAZAAR ==================== */}
            {viewEvent.type === "BAZAAR" && (
              <>
                <div>
                  <strong>Location:</strong> {viewEvent.location || "—"}
                </div>
                <div>
                  <strong>Starts:</strong> {formatDate(viewEvent.startDateTime)}
                </div>
                <div>
                  <strong>Ends:</strong> {formatDate(viewEvent.endDateTime)}
                </div>
                <div>
                  <strong>Registration Deadline:</strong>{" "}
                  {formatDate(viewEvent.registrationDeadline)}
                </div>
                <div>
                  <strong>Registered:</strong>{" "}
                  {viewEvent.registrations?.length || 0}
                </div>

                {viewEvent.description && (
                  <div style={{ marginTop: "10px" }}>
                    <strong>Description:</strong>
                    <p>{viewEvent.description}</p>
                  </div>
                )}
              </>
            )}

            {/* ==================== CONFERENCE ==================== */}
            {viewEvent.type === "CONFERENCE" && (
              <>
                <div>
                  <strong>Starts:</strong> {formatDate(viewEvent.startDateTime)}
                </div>
                <div>
                  <strong>Ends:</strong> {formatDate(viewEvent.endDateTime)}
                </div>
                <div>
                  <strong>Full Agenda:</strong> {viewEvent.agenda || "—"}
                </div>

                <div>
                  <strong>Conference Website:</strong>{" "}
                  {viewEvent.website ? (
                    <a
                      href={viewEvent.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {viewEvent.website}
                    </a>
                  ) : (
                    "—"
                  )}
                </div>

                <div>
                  <strong>Required Budget:</strong>{" "}
                  {formatMoney(viewEvent.budget)}
                </div>
                <div>
                  <strong>Funding Source:</strong>{" "}
                  {viewEvent.fundingSource || "—"}
                </div>
                <div>
                  <strong>Extra Resources:</strong>{" "}
                  {viewEvent.extraResources || "—"}
                </div>

                {viewEvent.shortDescription && (
                  <div style={{ marginTop: "10px" }}>
                    <strong>Short Description:</strong>
                    <p>{viewEvent.shortDescription}</p>
                  </div>
                )}
              </>
            )}
{/* ==================== TRIP ==================== */}
{viewEvent.type === "TRIP" && (
  <>
    <div>
      <strong>Location:</strong> {viewEvent.location || "—"}
    </div>
    <div>
      <strong>Price:</strong> {formatMoney(viewEvent.price)}
    </div>
    <div>
      <strong>Starts:</strong> {formatDate(viewEvent.startDateTime)}
    </div>
    <div>
      <strong>Ends:</strong> {formatDate(viewEvent.endDateTime)}
    </div>
    <div>
      <strong>Capacity:</strong> {viewEvent.capacity || "—"}
    </div>

    {/* THIS IS THE NEW CLEAR RESTRICTION DISPLAY */}
    <div style={{ 
      margin: "16px 0", 
      padding: "12px", 
      backgroundColor: viewEvent.allowedRoles?.length ? "#fef3c7" : "#d1fae5",
      borderRadius: "8px",
      border: viewEvent.allowedRoles?.length ? "2px solid #f59e0b" : "2px solid #10b981",
      fontWeight: "bold",
      fontSize: "15px",
      color: "#1f2937"
    }}>
      {viewEvent.allowedRoles?.length > 0 ? (
        <>
          Restricted to: {" "}
          {viewEvent.allowedRoles
            .map(role => role.charAt(0).toUpperCase() + role.slice(1) + "s")
            .join(", ")}
        </>
      ) : (
        <>Open to ALL users (Students, Professors, TAs, Staff)</>
      )}
    </div>

    <div>
      <strong>Registration Deadline:</strong>{" "}
      {formatDate(viewEvent.registrationDeadline)}
    </div>

    {viewEvent.shortDescription && (
      <div style={{ marginTop: "10px" }}>
        <strong>Description:</strong>
        <p>{viewEvent.shortDescription}</p>
      </div>
    )}
  </>
)}
            
            {/* ==================== WORKSHOP ==================== */}
            {viewEvent.type === "WORKSHOP" && (
              <>
                <div>
                  <strong>Location:</strong> {viewEvent.location || "—"}
                </div>
                <div>
                  <strong>Starts:</strong> {formatDate(viewEvent.startDateTime)}
                </div>
                <div>
                  <strong>Ends:</strong> {formatDate(viewEvent.endDateTime)}
                </div>
                <div>
                  <strong>Full Agenda:</strong> {viewEvent.agenda || "—"}
                </div>
                <div>
                  <strong>Faculty Responsible:</strong>{" "}
                  {viewEvent.facultyResponsible || "—"}
                </div>
                <div>
                  <strong>Professors Participating:</strong>{" "}
                  {viewEvent.professorsParticipating || "—"}
                </div>
                <div>
                  <strong>Required Budget:</strong>{" "}
                  {formatMoney(viewEvent.budget)}
                </div>
                <div>
                  <strong>Funding Source:</strong>{" "}
                  {viewEvent.fundingSource || "—"}
                </div>
                <div>
                  <strong>Extra Resources:</strong>{" "}
                  {viewEvent.extraResources || "—"}
                </div>
                <div>
                  <strong>Capacity:</strong> {viewEvent.capacity || "—"}
                </div>
                <div>
                  <strong>Registration Deadline:</strong>{" "}
                  {formatDate(viewEvent.registrationDeadline)}
                </div>

                {viewEvent.shortDescription && (
                  <div style={{ marginTop: "10px" }}>
                    <strong>Description:</strong>
                    <p>{viewEvent.shortDescription}</p>
                  </div>
                )}
              </>
            )}

            {/* ==================== BOOTH ==================== */}
            {viewEvent.type === "BOOTH" && (
              <>
                <div>
                  <strong>Booth Size:</strong> {viewEvent.boothSize || "—"}
                </div>
                <div>
                  <strong>Platform Slot:</strong>{" "}
                  {viewEvent.platformSlot || "—"}
                </div>
                <div>
                  <strong>Status:</strong> {viewEvent.status || "—"}
                </div>

                <div>
                  <strong>Attendee Names:</strong>{" "}
                  {viewEvent.attendees?.length
                    ? viewEvent.attendees.map((a) => a.name || "—").join(", ")
                    : "None"}
                </div>

                <div>
                  <strong>Attendee Emails:</strong>{" "}
                  {viewEvent.attendees?.length
                    ? viewEvent.attendees.map((a) => a.email).join(", ")
                    : "None"}
                </div>

                {viewEvent.description && (
                  <div style={{ marginTop: "10px" }}>
                    <strong>Description:</strong>
                    <p>{viewEvent.description}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
