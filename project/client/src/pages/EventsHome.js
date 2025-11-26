// client/src/pages/EventsHome.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Calendar,
  MapPin,
  Users,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import NotificationsDropdown from "../components/NotificationsDropdown";
import SearchableDropdown from "../components/SearchableDropdown";

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
  // ────────────────────── NOTIFICATIONS ──────────────────────
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const bellRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [professorFilter, setProfessorFilter] = useState("");
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
  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [docsList, setDocsList] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState("");
  const [viewerName, setViewerName] = useState("");

  const getBackendOrigin = () => {
    try {
      const origin = window.location.origin;
      const u = new URL(origin);
      if (u.port === "3001") u.port = "3000";
      return u.origin;
    } catch (e) {
      return window.location.origin;
    }
  };

  const absoluteUrl = (url) => {
    if (!url) return url;
    if (String(url).startsWith("http")) return url;
    if (String(url).startsWith("/")) return `${getBackendOrigin()}${url}`;
    return url;
  };

  const downloadFile = async (url, suggestedName) => {
    try {
      const abs = absoluteUrl(url);
      const token = localStorage.getItem("token");
      console.log("Downloading file:", abs);
      const res = await fetch(abs, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        setToast({ open: true, text: "Failed to download file" });
        return;
      }
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = suggestedName || "document";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download error:", err);
      setToast({ open: true, text: "Error downloading file" });
    }
  };

  const openViewer = (url, name) => {
    try {
      const abs = absoluteUrl(url);
      console.log("Opening viewer for:", abs);
      setDocsModalOpen(false);
      setViewerUrl(abs);
      setViewerName(name || "Document");
      setViewerOpen(true);
    } catch (err) {
      console.error("openViewer error:", err);
      setToast({ open: true, text: "Could not open viewer" });
    }
  };

  const getRoleFromToken = () => {
    try {
      const t = localStorage.getItem("token");
      if (!t) return null;
      const parts = t.split(".");
      if (parts.length < 2) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload.role || null;
    } catch (e) {
      return null;
    }
  };

  const userRole = getRoleFromToken();

  const [editRequest, setEditRequest] = useState({
    open: false,
    workshopId: null,
    message: "",
  });

  const [restrictionModal, setRestrictionModal] = useState({
    open: false,
    eventId: null,
    eventType: null,
    currentRoles: [],
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
        allowedRoles: w.allowedRoles || [], // Add this if workshops have allowedRoles
      }));
      setWorkshops(normalized);
    } catch (err) {
      console.error("Error fetching workshops:", err);
      setToast({ open: true, text: "Failed to load workshops" });
    }
  }, []); // Remove otherEvents dependency to prevent infinite loop

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
        allowedRoles: b.allowedRoles || [], // Add if booths have it
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

  // Separate effect to update conferences from otherEvents
  useEffect(() => {
    const normalizedConferences = otherEvents
      .filter((ev) => ev.type === "CONFERENCE")
      .map((c) => ({
        _id: c._id,
        type: "CONFERENCE",
        title: c.name || c.title,
        name: c.name || c.title,
        location: c.location,
        startDateTime: c.startDateTime,
        endDateTime: c.endDateTime,
        shortDescription: c.shortDescription,
        description: c.shortDescription,
        agenda: c.fullAgenda || c.agenda,
        website: c.website,
        budget: c.requiredBudget || c.budget,
        fundingSource: c.fundingSource,
        extraResources: c.extraResources,
        registrations: c.registeredUsers || [],
        status: c.status,
        image: conferenceImg,
        allowedRoles: c.allowedRoles || [],
      }));
    setConferences(normalizedConferences);
  }, [otherEvents]);

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

  // FETCH NOTIFICATIONS (optimized + no spam)
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n) => n.unread).length);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, []);

  const refreshAll = useCallback(() => {
    if (document.visibilityState === "visible") {
      fetchWorkshops();
      fetchBooths();
      refreshEvents();
      fetchNotifications();
    }
  }, [fetchWorkshops, fetchBooths, refreshEvents, fetchNotifications]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshAll();
    }, 8000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshAll(); // instant refresh when user comes back
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshAll]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initial load (only once)
  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      fetchWorkshops();
      fetchBooths();
      refreshEvents && refreshEvents();
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
      fetchWorkshops();
      fetchBooths();
      refreshEvents && refreshEvents();
    } catch (e) {
      console.error("Status update error:", e);
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
      fetchWorkshops();
      fetchBooths();
      refreshEvents && refreshEvents();
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
        const errorData = await res.json().catch(() => ({}));
        const errorMsg =
          errorData.error || errorData.message || "Export failed";
        setToast({ open: true, text: errorMsg });
        return;
      }

      // Check if response is JSON (no attendees case)
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.attendees && data.attendees.length === 0) {
          setToast({
            open: true,
            text: "📋 No registrations found for this event yet",
          });
          return;
        }
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

  // ====== Restriction Modal Handlers ======
  const handleOpenRestriction = (eventId, eventType, currentRoles = []) => {
    setRestrictionModal({
      open: true,
      eventId,
      eventType,
      currentRoles: currentRoles || [],
    });
  };

  const handleUpdateRestriction = async () => {
    const { eventId, eventType, currentRoles } = restrictionModal;

    try {
      const token = localStorage.getItem("token");
      const typeMap = {
        WORKSHOP: "workshops",
        CONFERENCE: "conferences",
        TRIP: "trips",
      };
      const path = typeMap[eventType.toUpperCase()];
      if (!path) {
        setToast({ open: true, text: "Unknown event type: " + eventType });
        return;
      }

      const res = await fetch(`/api/${path}/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ allowedRoles: currentRoles }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setToast({
          open: true,
          text: err.error || "Failed to update restrictions",
        });
        return;
      }

      setToast({ open: true, text: "Restrictions updated successfully!" });
      setRestrictionModal({
        open: false,
        eventId: null,
        eventType: null,
        currentRoles: [],
      });

      // Refresh data
      fetchWorkshops();
      fetchBooths();
      refreshEvents && refreshEvents();
    } catch (e) {
      console.error("Restriction update error:", e);
      setToast({
        open: true,
        text: "Network error: Could not update restrictions",
      });
    }
  };

  const handleToggleRole = (role) => {
    setRestrictionModal((prev) => {
      const roles = prev.currentRoles || [];
      if (roles.includes(role)) {
        return { ...prev, currentRoles: roles.filter((r) => r !== role) };
      } else {
        return { ...prev, currentRoles: [...roles, role] };
      }
    });
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
  const handleArchive = async (id, type) => {
    // Only allow events_office to archive
    if (userRole !== "events_office") {
      alert("You do not have permission to archive this item.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const typeMap = {
        TRIP: "trips",
        BAZAAR: "bazaars",
        CONFERENCE: "conferences",
        WORKSHOP: "workshops",
        BOOTH: "booths",
      };
      const path = typeMap[type.toUpperCase()];
      if (!path) return alert("Unknown event type: " + type);

      const res = await fetch(`/api/${path}/${id}`, {
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
      alert(data.message || "Archived successfully!");

      // Refresh data
      refreshAll();
    } catch (err) {
      console.error(err);
      alert("Failed to archive: Network error");
    }
  };

  /* ----------------------------------------------------
   EXTRACT UNIQUE LOCATIONS AND PROFESSORS
  ---------------------------------------------------- */
  const uniqueLocations = React.useMemo(() => {
    const locations = allEvents
      .map((e) => e.location)
      .filter((loc) => loc && loc.trim() !== "");
    return [...new Set(locations)].sort();
  }, [allEvents]);

  const uniqueProfessors = React.useMemo(() => {
    const professors = allEvents
      .map((e) => e.professorsParticipating || e.facultyResponsible)
      .filter((prof) => prof && prof.trim() !== "");
    return [...new Set(professors)].sort();
  }, [allEvents]);

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

      // Exact match for location filter
      const matchLocation =
        !searchLocation || (ev.location || "") === searchLocation;

      // Exact match for professor filter
      const matchProfessor =
        !professorFilter ||
        (ev.professorsParticipating || "") === professorFilter ||
        (ev.facultyResponsible || "") === professorFilter;

      const matchType = filter === "All" || ev.type === filter;
      const startDate = ev.startDateTime || ev.startDate || ev.date;
      const matchDate =
        !debouncedDate ||
        (startDate &&
          new Date(startDate).toISOString().slice(0, 10) === debouncedDate);

      return (
        matchSearch && matchLocation && matchProfessor && matchType && matchDate
      );
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

  // Close toast after 3s
  useEffect(() => {
    if (!toast.open) return;
    const t = setTimeout(() => setToast((t) => ({ ...t, open: false })), 3000);
    return () => clearTimeout(t);
  }, [toast.open]);

  const createPathMap = {
    trip: "/trips/create",
    conference: "/conferences/create",
    workshop: "/workshops/create",
    bazaar: "/bazaars/create",
    booth: "/booths/create",
  };

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
            <div style={{ position: "relative", flex: 1, maxWidth: "242px" }}>
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
                placeholder="Search events..."
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

            <div style={{ width: "160px" }}>
              <SearchableDropdown
                options={uniqueLocations}
                value={searchLocation}
                onChange={setSearchLocation}
                placeholder="All Locations"
                label="Location"
                icon={MapPin}
              />
            </div>

            <div style={{ width: "160px" }}>
              <SearchableDropdown
                options={uniqueProfessors}
                value={professorFilter}
                onChange={setProfessorFilter}
                placeholder="All Professors"
                label="Professor"
                icon={Users}
              />
            </div>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                width: "100px",
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
                border: "none",
                background: "#567c8d",
                color: "white",
                fontSize: "13px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {sortOrder === "asc" ? (
                <ArrowUp size={16} />
              ) : (
                <ArrowDown size={16} />
              )}
              {sortOrder === "asc" ? "Oldest" : "Newest"}
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

            {(userRole === "events_office" || userRole === "admin") && (
              <button
                style={{ ...topActionBtnStyle, background: "#567c8d" }}
                onClick={async () => {
                  setDocsLoading(true);
                  setDocsList([]);
                  try {
                    const token = localStorage.getItem("token");
                    const [bRes, boRes] = await Promise.all([
                      fetch(`/api/bazaar-applications`, {
                        headers: { Authorization: `Bearer ${token}` },
                      }),
                      fetch(`/api/booth-applications`, {
                        headers: { Authorization: `Bearer ${token}` },
                      }),
                    ]);

                    const bJson = await (bRes.ok ? bRes.json() : []);
                    const boJson = await (boRes.ok ? boRes.json() : []);

                    const gather = (arr) => {
                      if (!arr || !Array.isArray(arr)) return [];
                      return arr.flatMap((r) => {
                        const attendees = Array.isArray(r.attendees)
                          ? r.attendees
                          : [];
                        return attendees
                          .filter((a) => a && a.idDocument)
                          .map((a) => ({
                            name: a.name || a.fullName || "Unnamed",
                            email: a.email || a.emailAddress || "",
                            url: String(a.idDocument).startsWith("/")
                              ? `${window.location.origin}${a.idDocument}`
                              : String(a.idDocument),
                            source: r.vendorName || r._id || "vendor",
                          }));
                      });
                    };

                    const bazList = Array.isArray(bJson)
                      ? gather(bJson)
                      : gather(bJson.requests || []);
                    const boothList = Array.isArray(boJson)
                      ? gather(boJson)
                      : gather(boJson.requests || []);

                    setDocsList([...bazList, ...boothList]);
                    setDocsModalOpen(true);
                  } catch (err) {
                    console.error("Error fetching docs:", err);
                    setToast({ open: true, text: "Failed to load documents" });
                  } finally {
                    setDocsLoading(false);
                  }
                }}
              >
                View Docs
              </button>
            )}

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
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="pg-btn arrow"
            >
              ‹
            </button>
            <div className="pg-btn current">{currentPage}</div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
              const editable = isEditable(ev.startDateTime || ev.startDate);
              const isPast = isPastEvent(ev);
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
                        <button
                          className="btn btn-outline"
                          onClick={() => setViewEvent(ev)}
                        >
                          View Details
                        </button>

                        {/* ARCHIVE BUTTON — only for past events */}
                        {isPast && ev.status !== "archived" && (
                          <button
                            className="btn"
                            style={{ background: "#8B4513", color: "white" }}
                            onClick={() => handleArchive(ev._id, ev.type)}
                          >
                            Archive
                          </button>
                        )}

                        {editable && ev.status !== "archived" ? (
                          <button
                            className="btn"
                            onClick={() => navigate(`/bazaars/${ev._id}`)}
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
                          disabled={
                            ev.status === "archived" ||
                            ev.registrations?.length > 0
                          }
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
                          onClick={() =>
                            navigate(`/bazaars/${ev._id}/vendor-requests`)
                          }
                        >
                          Vendor Requests
                        </button>

                        <button
                          className="btn"
                          style={{ background: "#c88585", color: "white" }}
                          onClick={() => exportAttendees(ev._id, "bazaars")}
                        >
                          Export Excel
                        </button>

                        {ev.status === "archived" && (
                          <div
                            className="chip"
                            style={{
                              background: "#666",
                              color: "white",
                              marginTop: "8px",
                            }}
                          >
                            ARCHIVED
                          </div>
                        )}
                      </>
                    )}

                    {/* TRIP */}
                    {isTrip && (
                      <>
                        <button
                          className="btn btn-outline"
                          onClick={() => setViewEvent(ev)}
                        >
                          View Details
                        </button>

                        {/* ARCHIVE BUTTON — only shows if trip has passed and not yet archived */}
                        {isPast && ev.status !== "archived" && (
                          <button
                            className="btn"
                            style={{ background: "#8B4513", color: "white" }}
                            onClick={() => handleArchive(ev._id, ev.type)}
                          >
                            Archive
                          </button>
                        )}

                        {/* Edit button */}
                        {editable && ev.status !== "archived" ? (
                          <button
                            className="btn"
                            onClick={() => navigate(`/trips/${ev._id}`)}
                          >
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
                          title={
                            ev.status === "archived"
                              ? "Cannot delete archived event"
                              : "Delete this trip"
                          }
                        >
                          Delete
                        </button>

                        {/* Export Excel */}
                        <button
                          className="btn"
                          style={{ background: "#c88585", color: "white" }}
                          onClick={() => exportAttendees(ev._id, "trips")}
                        >
                          Export Excel
                        </button>

                        {/* ARCHIVED badge */}
                        {ev.status === "archived" && (
                          <div
                            className="chip"
                            style={{
                              background: "#666",
                              color: "white",
                              marginTop: "8px",
                            }}
                          >
                            ARCHIVED
                          </div>
                        )}
                      </>
                    )}

                    {/* CONFERENCE */}
                    {isConference && (
                      <>
                        <button
                          className="btn btn-outline"
                          onClick={() => setViewEvent(ev)}
                        >
                          View Details
                        </button>

                        {/* ARCHIVE BUTTON — only appears if conference has ended and is not yet archived */}
                        {isPast && ev.status !== "archived" && (
                          <button
                            className="btn"
                            style={{ background: "#8B4513", color: "white" }}
                            onClick={() => handleArchive(ev._id, ev.type)}
                          >
                            Archive
                          </button>
                        )}

                        {/* Edit button */}
                        {editable && ev.status !== "archived" ? (
                          <button
                            className="btn"
                            onClick={() => navigate(`/conferences/${ev._id}`)}
                          >
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
                          title={
                            ev.status === "archived"
                              ? "Cannot delete archived event"
                              : "Delete this conference"
                          }
                        >
                          Delete
                        </button>

                        {/* ARCHIVED badge */}
                        {ev.status === "archived" && (
                          <div
                            className="chip"
                            style={{
                              background: "#666",
                              color: "white",
                              marginTop: "8px",
                            }}
                          >
                            ARCHIVED
                          </div>
                        )}
                      </>
                    )}

                    {/* WORKSHOP */}
                    {isWorkshop && (
                      <>
                        <button
                          className="btn btn-outline"
                          onClick={() => setViewEvent(ev)}
                        >
                          View Details
                        </button>

                        {/* ARCHIVE BUTTON — only shows if workshop has ended and is NOT archived */}
                        {isPast && ev.status !== "archived" && (
                          <button
                            className="btn"
                            style={{ background: "#8B4513", color: "white" }}
                            onClick={() => handleArchive(ev._id, ev.type)}
                          >
                            Archive
                          </button>
                        )}

                        {/* Accept/Reject/Request Edits — only if NOT archived */}
                        {ev.status !== "archived" &&
                          (ev.status === "pending" ||
                            ev.status === "edits_requested") && (
                            <>
                              <button
                                className="btn btn-success"
                                onClick={() => handleAccept(id)}
                              >
                                Accept & Publish
                              </button>
                              <button
                                className="btn"
                                style={{
                                  background: "#f59e0b",
                                  color: "white",
                                }}
                                onClick={() =>
                                  handleOpenRestriction(
                                    id,
                                    "WORKSHOP",
                                    ev.allowedRoles || []
                                  )
                                }
                              >
                                Restriction
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

                        {/* Export Excel — only for published workshops and NOT archived */}
                        {ev.status === "published" && (
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
                          <div
                            className="chip"
                            style={{
                              background: "#666",
                              color: "white",
                              marginTop: "8px",
                            }}
                          >
                            ARCHIVED
                          </div>
                        )}
                      </>
                    )}

                    {/* BOOTH */}
                    {isBooth && (
                      <>
                        <button
                          className="btn btn-outline"
                          onClick={() => setViewEvent(ev)}
                        >
                          View Details
                        </button>

                        {/* ARCHIVE BUTTON — only shows if booth has ended and is NOT archived */}
                        {isPast && ev.status !== "archived" && (
                          <button
                            className="btn"
                            style={{ background: "#8B4513", color: "white" }}
                            onClick={() => handleArchive(ev._id, ev.type)}
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

                        {/* Export Excel */}
                        <button
                          className="btn"
                          style={{ background: "#c88585", color: "white" }}
                          onClick={() => exportAttendees(id, "booths")}
                        >
                          Export Excel
                        </button>

                        {/* ARCHIVED badge */}
                        {ev.status === "archived" && (
                          <div
                            className="chip"
                            style={{
                              background: "#666",
                              color: "white",
                              marginTop: "8px",
                            }}
                          >
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

      {/* ===== Restriction Modal ===== */}
      {restrictionModal.open && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm" style={{ maxWidth: "500px" }}>
            <h2>Manage Role Restrictions</h2>
            <p style={{ marginBottom: "16px", color: "#567c8d" }}>
              Select which roles can register for this event. If no roles are
              selected, the event will be open to everyone.
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                marginBottom: "24px",
                padding: "16px",
                background: "#f5efeb",
                borderRadius: "8px",
              }}
            >
              {["student", "professor", "ta", "staff"].map((role) => (
                <label
                  key={role}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "15px",
                    cursor: "pointer",
                    userSelect: "none",
                    minWidth: "120px",
                  }}
                >
                  <input
                    type="checkbox"
                    value={role}
                    checked={restrictionModal.currentRoles.includes(role)}
                    onChange={() => handleToggleRole(role)}
                    style={{
                      width: "18px",
                      height: "18px",
                      marginRight: "8px",
                      cursor: "pointer",
                    }}
                  />
                  <span style={{ textTransform: "capitalize" }}>
                    {role}s only
                  </span>
                </label>
              ))}
            </div>

            {/* Preview */}
            <div
              style={{
                padding: "12px",
                background:
                  restrictionModal.currentRoles.length > 0
                    ? "#fef3c7"
                    : "#d1fae5",
                border:
                  restrictionModal.currentRoles.length > 0
                    ? "2px solid #f59e0b"
                    : "2px solid #10b981",
                borderRadius: "8px",
                marginBottom: "16px",
                fontWeight: "bold",
                fontSize: "14px",
                color: "#1f2937",
              }}
            >
              {restrictionModal.currentRoles.length > 0 ? (
                <>
                  Restricted to:{" "}
                  {restrictionModal.currentRoles
                    .map((r) => r.charAt(0).toUpperCase() + r.slice(1) + "s")
                    .join(", ")}
                </>
              ) : (
                <>Open to ALL users (Students, Professors, TAs, Staff)</>
              )}
            </div>

            <div className="confirm-actions">
              <button
                className="btn btn-outline"
                onClick={() =>
                  setRestrictionModal({
                    open: false,
                    eventId: null,
                    eventType: null,
                    currentRoles: [],
                  })
                }
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpdateRestriction}
              >
                Save Restrictions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Horizontal Layout */}
      {chooseOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full animate-scale-in">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Calendar size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">New Event</h3>
                  <p className="text-gray-500 text-sm">Choose event type</p>
                </div>
              </div>
            </div>

            {/* Event Options */}
            <div className="flex p-4 gap-2">
              {[
                {
                  type: "trip",
                  label: "Trip",
                  icon: "🚌",
                  color: "border-blue-200 hover:bg-blue-50",
                },
                {
                  type: "conference",
                  label: "Conference",
                  icon: "🎤",
                  color: "border-purple-200 hover:bg-purple-50",
                },

                {
                  type: "bazaar",
                  label: "Bazaar",
                  icon: "🛍️",
                  color: "border-orange-200 hover:bg-orange-50",
                },
              ].map(({ type, label, icon, color }) => (
                <button
                  key={type}
                  onClick={() => {
                    setChooseOpen(false);
                    navigate(createPathMap[type]);
                  }}
                  className={`flex-1 flex flex-col items-center p-3 rounded-lg border-2 ${color} transition-all duration-200 hover:scale-105`}
                >
                  <span className="text-2xl mb-1">{icon}</span>
                  <span className="font-medium text-xs">{label}</span>
                </button>
              ))}
            </div>

            {/* Cancel */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setChooseOpen(false)}
                className="w-full py-2.5 text-gray-600 hover:text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
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

                {/* Display restricted roles */}
                <div
                  style={{
                    margin: "16px 0",
                    padding: "12px",
                    backgroundColor: viewEvent.allowedRoles?.length
                      ? "#fef3c7"
                      : "#d1fae5",
                    borderRadius: "8px",
                    border: viewEvent.allowedRoles?.length
                      ? "2px solid #f59e0b"
                      : "2px solid #10b981",
                    fontWeight: "bold",
                    fontSize: "15px",
                    color: "#1f2937",
                  }}
                >
                  {viewEvent.allowedRoles?.length > 0 ? (
                    <>
                      Restricted to:{" "}
                      {viewEvent.allowedRoles
                        .map(
                          (r) => r.charAt(0).toUpperCase() + r.slice(1) + "s"
                        )
                        .join(", ")}
                    </>
                  ) : (
                    <>Open to ALL users (Students, Professors, TAs, Staff)</>
                  )}
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

                {/* Display restricted roles */}
                <div
                  style={{
                    margin: "16px 0",
                    padding: "12px",
                    backgroundColor: viewEvent.allowedRoles?.length
                      ? "#fef3c7"
                      : "#d1fae5",
                    borderRadius: "8px",
                    border: viewEvent.allowedRoles?.length
                      ? "2px solid #f59e0b"
                      : "2px solid #10b981",
                    fontWeight: "bold",
                    fontSize: "15px",
                    color: "#1f2937",
                  }}
                >
                  {viewEvent.allowedRoles?.length > 0 ? (
                    <>
                      Restricted to:{" "}
                      {viewEvent.allowedRoles
                        .map(
                          (r) => r.charAt(0).toUpperCase() + r.slice(1) + "s"
                        )
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

      {/* ===== Documents Modal (Events Office) ===== */}
      {docsModalOpen && (
        <div
          className="confirm-overlay"
          role="dialog"
          aria-modal="true"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "white",
              padding: 0,
              width: "580px",
              maxHeight: "90vh",
              overflow: "hidden",
              borderRadius: "12px",
              position: "relative",
              boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                background: "#3B82F6",
                color: "white",
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>Uploaded Attendee Documents</h3>
                <p style={{ color: "#E5E7EB", fontSize: 14, margin: 0 }}>
                  Uploaded IDs
                </p>
              </div>
              <button
                onClick={() => setDocsModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "white",
                  fontSize: 20,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: 12, overflowY: "auto", flex: 1 }}>
              {docsLoading ? (
                <div style={{ padding: 16, textAlign: "center" }}>
                  Loading...
                </div>
              ) : docsList.length === 0 ? (
                <div
                  style={{ padding: 16, color: "#6B7280", textAlign: "center" }}
                >
                  No uploaded documents found.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        textAlign: "left",
                        borderBottom: "1px solid #E5E7EB",
                      }}
                    >
                      <th style={{ padding: 8 }}>Name</th>
                      <th style={{ padding: 8 }}>Email</th>
                      <th style={{ padding: 8 }}>Source</th>
                      <th style={{ padding: 8 }}>Document</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docsList.map((d, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: 8 }}>{d.name}</td>
                        <td style={{ padding: 8 }}>{d.email}</td>
                        <td style={{ padding: 8 }}>{d.source}</td>
                        <td
                          style={{
                            padding: 8,
                            display: "flex",
                            gap: 8,
                            justifyContent: "center",
                          }}
                        >
                          <button
                            onClick={() => openViewer(d.url, d.name)}
                            style={{
                              background: "transparent",
                              border: "1px solid #2563EB",
                              color: "#2563EB",
                              padding: "6px 10px",
                              borderRadius: 6,
                              cursor: "pointer",
                            }}
                          >
                            View
                          </button>
                          <button
                            onClick={() =>
                              downloadFile(d.url, `${d.name || "document"}`)
                            }
                            style={{
                              background: "#2563EB",
                              border: "none",
                              color: "white",
                              padding: "6px 10px",
                              borderRadius: 6,
                              cursor: "pointer",
                            }}
                          >
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div
              style={{
                padding: "10px 15px",
                borderTop: "1px solid #E5E7EB",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setDocsModalOpen(false)}
                style={{
                  backgroundColor: "#9CA3AF",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 16px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Document Viewer Modal ===== */}
      {viewerOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "rgba(0,0,0,0.45)",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 0,
              width: "80%",
              maxWidth: 1000,
              height: "90vh",
              borderRadius: 10,
              boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "#3B82F6",
                color: "white",
                padding: "10px 15px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>{viewerName}</h3>
                <p style={{ color: "#E5E7EB", fontSize: 14, margin: 0 }}>
                  Preview
                </p>
              </div>
              <button
                onClick={() => setViewerOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "white",
                  fontSize: 18,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                flex: 1,
                padding: 0,
                background: "#f8fafc",
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {viewerUrl &&
              (viewerUrl.endsWith(".pdf") ||
                !viewerUrl.match(/\.(jpg|jpeg|png|gif|bmp)$/i)) ? (
                <iframe
                  src={viewerUrl}
                  title={viewerName}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    display: "block",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 12,
                  }}
                >
                  <img
                    src={viewerUrl}
                    alt={viewerName}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      width: "auto",
                      height: "auto",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>
              )}
            </div>
            <div
              style={{
                padding: "10px 15px",
                borderTop: "1px solid #E5E7EB",
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                onClick={() => setViewerOpen(false)}
                style={{
                  backgroundColor: "#9CA3AF",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 16px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
