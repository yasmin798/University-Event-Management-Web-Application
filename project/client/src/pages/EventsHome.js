// client/src/pages/EventsHome.js
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  Search,
  Calendar,
  MapPin,
  Users,
  MoreVertical, // New Icon
  Plus, // New Icon
  FileText, // New Icon
  Trash2, // New Icon
  Archive, // New Icon
  Download, // New Icon
  Star, // New Icon for ratings
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import NotificationsDropdown from "../components/NotificationsDropdown";
import SearchableDropdown from "../components/SearchableDropdown";

import workshopPlaceholder from "../images/workshop.png";
import boothPlaceholder from "../images/booth.jpg";
import { workshopAPI } from "../api/workshopApi";
import { useServerEvents } from "../hooks/useServerEvents";
import Sidebar from "../components/Sidebar";

import conferenceImg from "../images/Conferenceroommeetingconcept.jpeg";
import tripImg from "../images/Womanlookingatmapplanningtrip.jpeg";
import bazaarImg from "../images/Arabbazaarisolatedonwhitebackground_FreeVector.jpeg";
import workshopImg from "../images/download(12).jpeg";

// --- helpers ---
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

function isEditable(startIso) {
  if (!startIso) return true;
  return new Date(startIso).getTime() > Date.now();
}

function isPastEvent(ev) {
  const endDate = ev.endDateTime || ev.endDate;
  if (!endDate) return false;
  return new Date(endDate).getTime() < Date.now();
}

// Styled for the new Dropdowns
const menuBtnStyle = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "8px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--navy)",
  transition: "background 0.2s",
};

const dropdownMenuStyle = {
  position: "absolute",
  right: "0",
  top: "40px",
  background: "white",
  border: "1px solid #eee",
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  zIndex: 50,
  minWidth: "180px",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const dropdownItemStyle = {
  padding: "10px 16px",
  background: "transparent",
  border: "none",
  textAlign: "left",
  cursor: "pointer",
  fontSize: "14px",
  color: "#333",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  borderBottom: "1px solid #f9f9f9",
};

export default function EventsHome() {
  const navigate = useNavigate();
  const [viewEvent, setViewEvent] = useState(null);
  const [conferences, setConferences] = useState([]);
  const [bazaars, setBazaars] = useState([]);
  const [trips, setTrips] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [professorFilter, setProfessorFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [filter, setFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("desc");
  const [params] = useSearchParams();

  // Debounce
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [debouncedDate, setDebouncedDate] = useState(dateFilter);

  // Menus State
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [activeCardMenu, setActiveCardMenu] = useState(null); // ID of the card with open menu
  const createMenuRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedDate(dateFilter), 300);
    return () => clearTimeout(t);
  }, [dateFilter]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target)) {
        setCreateMenuOpen(false);
      }
      if (activeCardMenu && !e.target.closest(".card-menu-container")) {
        setActiveCardMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeCardMenu]);

  const [currentPage, setCurrentPage] = useState(1);
  const [chooseOpen, setChooseOpen] = useState(false);
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
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState("");

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

  const openViewer = async (url, name) => {
    try {
      const abs = absoluteUrl(url);
      const token = localStorage.getItem("token");

      // Fetch the document as a blob with auth headers
      const res = await fetch(abs, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        setToast({ open: true, text: "Failed to load document" });
        return;
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      setDocsModalOpen(false);
      setViewerUrl(blobUrl);
      setViewerOpen(true);
    } catch (err) {
      console.error("Viewer error:", err);
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

  // DEBUG: Log to check role
  useEffect(() => {
    console.log("User role from token:", userRole);
  }, [userRole]);

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
        location: w.location,
        startDateTime: w.startDateTime,
        endDateTime: w.endDateTime,
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
        allowedRoles: w.allowedRoles || [],
      }));
      setWorkshops((prevWorkshops) => {
        // Merge with existing state to preserve any local updates (like restrictions)
        return normalized.map((newWorkshop) => {
          const existing = prevWorkshops.find((w) => w._id === newWorkshop._id);
          return existing
            ? { ...newWorkshop, allowedRoles: existing.allowedRoles }
            : newWorkshop;
        });
      });
    } catch (err) {
      console.error("Error fetching workshops:", err);
    }
  }, []);

  const fetchBooths = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/booth-applications", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        console.warn("Failed to fetch booths, status:", res.status);
        return;
      }
      const data = await res.json();
      console.log("Raw booths data:", data);

      // Handle both array and { items } format
      let boothArray = Array.isArray(data) ? data : data.items || [];
      console.log("Booth array to normalize:", boothArray);

      const normalized = boothArray.map((b) => ({
        _id: b._id,
        title: b.boothTitle || b.attendees?.[0]?.name || `Booth ${b._id}`,
        description: b.boothTitle || "",
        shortDescription: b.boothTitle || "",
        boothSize: b.boothSize,
        duration: b.durationWeeks,
        platformSlot: b.platformSlot,
        status: b.status,
        capacity: b.capacity,
        budget: b.budget,
        registrations: b.registrations || [],
        attendees:
          b.attendees?.map((a) => ({
            name: a.name,
            email: a.email,
            idDocument: a.idDocument,
            attendingEntireDuration: a.attendingEntireDuration,
          })) || [],
        type: "BOOTH",
        image: b.image || boothPlaceholder,
        allowedRoles: b.allowedRoles || [],
        endDateTime: b.bazaar?.endDateTime || null,
      }));
      console.log("Normalized booths:", normalized);
      setBooths((prevBooths) => {
        // Merge with existing state to preserve any local updates (like restrictions)
        return normalized.map((newBooth) => {
          const existing = prevBooths.find((b) => b._id === newBooth._id);
          return existing
            ? { ...newBooth, allowedRoles: existing.allowedRoles }
            : newBooth;
        });
      });
    } catch (err) {
      console.error("Error fetching booths:", err);
    }
  }, []);

  const fetchBazaars = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/events/bazaars", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        console.warn("Failed to fetch bazaars, status:", res.status);
        return;
      }
      const data = await res.json();
      console.log("Raw bazaars data:", data);

      // API returns { items, total, page, pages }
      let bazaarArray = [];
      if (data.items && Array.isArray(data.items)) {
        bazaarArray = data.items;
      } else if (Array.isArray(data)) {
        bazaarArray = data;
      } else if (data.bazaars && Array.isArray(data.bazaars)) {
        bazaarArray = data.bazaars;
      }

      console.log("Bazaar array to normalize:", bazaarArray);

      const normalized = bazaarArray.map((b) => ({
        _id: b._id,
        title: b.title,
        description: b.description || "",
        shortDescription: b.shortDescription || "",
        startDateTime: b.startDateTime,
        endDateTime: b.endDateTime,
        location: b.location,
        status: b.status,
        type: "BAZAAR",
        image: bazaarImg,
        registrations: b.registrations || [],
        allowedRoles: b.allowedRoles || [],
      }));
      console.log("Normalized bazaars:", normalized);
      setBazaars((prevBazaars) => {
        // Merge with existing state to preserve any local updates (like restrictions)
        return normalized.map((newBazaar) => {
          const existing = prevBazaars.find((b) => b._id === newBazaar._id);
          return existing
            ? { ...newBazaar, allowedRoles: existing.allowedRoles }
            : newBazaar;
        });
      });
    } catch (err) {
      console.error("Error fetching bazaars:", err);
    }
  }, []);
  useEffect(() => {
    Promise.all([fetchWorkshops(), fetchBooths(), fetchBazaars()]).finally(() =>
      setLoading(false)
    );
  }, [fetchWorkshops, fetchBooths, fetchBazaars]);

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
        capacity: c.capacity,
        fundingSource: c.fundingSource,
        extraResources: c.extraResources,
        registrations: c.registeredUsers || [],
        status: c.status,
        image: conferenceImg,
        allowedRoles: c.allowedRoles || [],
      }));
    setConferences((prevConferences) => {
      // Merge with existing state to preserve any local updates (like restrictions)
      return normalizedConferences.map((newConf) => {
        const existing = prevConferences.find((c) => c._id === newConf._id);
        return existing
          ? { ...newConf, allowedRoles: existing.allowedRoles }
          : newConf;
      });
    });
  }, [otherEvents]);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        // const data = await res.json();
        // Notifications are handled by NotificationsDropdown component
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, []);

  const refreshAll = useCallback(() => {
    if (document.visibilityState === "visible") {
      fetchWorkshops();
      fetchBooths();
      fetchBazaars();
      refreshEvents();
      fetchNotifications();
    }
  }, [
    fetchWorkshops,
    fetchBooths,
    fetchBazaars,
    refreshEvents,
    fetchNotifications,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshAll();
    }, 8000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshAll();
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
      // Notifications are handled by NotificationsDropdown component
      if (createMenuRef.current && !createMenuRef.current.contains(e.target)) {
        setCreateMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const allEvents = useMemo(
    () => [
      ...otherEvents.filter(
        (e) => !["CONFERENCE", "WORKSHOP", "BAZAAR"].includes(e.type)
      ),
      ...conferences,
      ...workshops,
      ...booths,
      ...bazaars,
      ...trips,
    ],
    [otherEvents, conferences, workshops, booths, bazaars, trips]
  );

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
      fetchBazaars();
      refreshEvents && refreshEvents();
    } catch (e) {
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
      fetchBazaars();
      refreshEvents && refreshEvents();
    } catch (e) {
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
      fetchBazaars();
      refreshEvents && refreshEvents();
    } catch (e) {
      setToast({ open: true, text: "Network error: Could not send request" });
    }
  };

  const exportAttendees = async (eventId, eventType) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `/api/events/${eventId}/registrations?format=xlsx`,
        {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        setToast({ open: true, text: error.error || "Export failed" });
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `attendees_${eventType}_${eventId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
      setToast({ open: true, text: "Excel exported successfully ✔" });
    } catch (err) {
      console.error("Export error:", err);
      setToast({ open: true, text: "Export error" });
    }
  };

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
        BAZAAR: "bazaars",
        BOOTH: "booths",
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
        setToast({ open: true, text: "Failed to update restrictions" });
        return;
      }
      setToast({ open: true, text: "Restrictions updated successfully!" });
      setRestrictionModal({
        open: false,
        eventId: null,
        eventType: null,
        currentRoles: [],
      });

      // Update local state to reflect the restriction change immediately
      if (eventType === "WORKSHOP") {
        setWorkshops((ws) =>
          ws.map((w) =>
            w._id === eventId ? { ...w, allowedRoles: currentRoles } : w
          )
        );
      } else if (eventType === "CONFERENCE") {
        setConferences((cs) =>
          cs.map((c) =>
            c._id === eventId ? { ...c, allowedRoles: currentRoles } : c
          )
        );
      } else if (eventType === "BAZAAR") {
        setBazaars((bz) =>
          bz.map((b) =>
            b._id === eventId ? { ...b, allowedRoles: currentRoles } : b
          )
        );
      } else if (eventType === "TRIP") {
        setTrips((ts) =>
          ts.map((t) =>
            t._id === eventId ? { ...t, allowedRoles: currentRoles } : t
          )
        );
      } else if (eventType === "BOOTH") {
        setBooths((bs) =>
          bs.map((b) =>
            b._id === eventId ? { ...b, allowedRoles: currentRoles } : b
          )
        );
      }
    } catch (e) {
      setToast({ open: true, text: "Network error" });
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
      title: "Accept and publish?",
      body: "Are you sure you want to accept and publish this workshop?",
      onConfirm: () => doUpdateStatus(id, "published"),
      confirmLabel: "Publish",
      cancelLabel: "Cancel",
    });
  };

  const handleReject = (id) => {
    setConfirm({
      open: true,
      title: "Reject this workshop?",
      body: "Are you sure you want to reject this workshop?",
      onConfirm: () => doUpdateStatus(id, "rejected"),
      confirmLabel: "Reject",
      cancelLabel: "Cancel",
    });
  };

  const handleRequestEdits = (id) => {
    setEditRequest({ open: true, workshopId: id, message: "" });
  };

  const handleArchive = async (id, rawType) => {
    const token = localStorage.getItem("token");

    const typeMap = {
      WORKSHOP: "workshops",
      TRIP: "trips",
      BAZAAR: "bazaars",
      CONFERENCE: "conferences",
      BOOTH: "booths",
    };

    const type = typeMap[rawType];
    if (!type) return alert("❗ Unknown event type");

    try {
      const res = await fetch(`/api/${type}/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "archived" }),
      });

      const data = await res.json();
      if (!res.ok) return alert("Archive failed: " + (data.error || "Unknown"));

      alert("✔ Archived successfully");

      // 🔥 UPDATE UI based on type - use the fresh data from server if available
      if (rawType === "WORKSHOP")
        setWorkshops((ws) =>
          ws.map((w) =>
            w._id === id ? { ...w, status: data.status || "archived" } : w
          )
        );

      if (rawType === "BOOTH")
        setBooths((bs) =>
          bs.map((b) =>
            b._id === id ? { ...b, status: data.status || "archived" } : b
          )
        );

      if (rawType === "BAZAAR")
        setBazaars((bz) =>
          bz.map((b) =>
            b._id === id ? { ...b, status: data.status || "archived" } : b
          )
        );

      if (rawType === "CONFERENCE")
        setConferences((cs) =>
          cs.map((c) =>
            c._id === id ? { ...c, status: data.status || "archived" } : c
          )
        );

      if (rawType === "TRIP")
        setTrips((ts) =>
          ts.map((t) =>
            t._id === id ? { ...t, status: data.status || "archived" } : t
          )
        );
    } catch (err) {
      console.error(err);
      alert("⚠ Server error");
    }
  };

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
      const matchLocation =
        !searchLocation || (ev.location || "") === searchLocation;
      const matchProfessor =
        !professorFilter ||
        (ev.professorsParticipating || "") === professorFilter ||
        (ev.facultyResponsible || "") === professorFilter;
      const matchType =
        filter === "All" || ev.type.toUpperCase() === filter.toUpperCase();

      const startDate = ev.startDateTime || ev.startDate || ev.date;
      const matchDate =
        !debouncedDate ||
        (startDate &&
          new Date(startDate).toISOString().slice(0, 10) === debouncedDate);

      // DEBUG: Log filter decisions for booths and bazaars
      if (ev.type === "BOOTH" || ev.type === "BAZAAR") {
        console.log(`Event: ${ev.title} (${ev.type}):`, {
          matchType,
          filter,
          evType: ev.type,
          matchSearch,
          matchLocation,
          matchProfessor,
          matchDate,
          pass:
            matchSearch &&
            matchLocation &&
            matchProfessor &&
            matchType &&
            matchDate,
        });
      }

      return (
        matchSearch && matchLocation && matchProfessor && matchType && matchDate
      );
    })
    .sort((a, b) => {
      const A = new Date(a.startDateTime || a.startDate || a.date);
      const B = new Date(b.startDateTime || b.startDate || b.date);

      if (isNaN(A) && isNaN(B)) return 0;
      if (isNaN(A)) return 1;
      if (isNaN(B)) return -1;

      return sortOrder === "asc" ? A - B : B - A;
    });

  useEffect(() => {
    const urlFilter = params.get("filter");
    console.log("URL filter param:", urlFilter);
    if (urlFilter) {
      console.log("Setting filter to:", urlFilter);
      setFilter(urlFilter);
    } else {
      console.log("No URL filter, setting to 'All'");
      setFilter("All");
    }
  }, [params]);

  // DEBUG: Log whenever filter changes to see if it's being set correctly
  useEffect(() => {
    console.log("FILTER STATE CHANGED TO:", filter);
    console.log("Current allEvents count:", allEvents.length);
    console.log("Current filteredEvents count:", filteredEvents.length);
    console.log("Bazaars in state:", bazaars.length);
    console.log("Booths in state:", booths.length);
  }, [
    filter,
    allEvents.length,
    bazaars.length,
    booths.length,
    filteredEvents.length,
  ]);

  const ITEMS_PER_PAGE = 9; // Increased slightly since layout is cleaner
  const indexOfLast = currentPage * ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - ITEMS_PER_PAGE;
  const currentEvents = filteredEvents.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);

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
      <Sidebar filter={filter} setFilter={setFilter} />
      <main style={{ flex: 1, marginLeft: "260px", padding: "0 24px 24px" }}>
        {/* ==================== CLEANED HEADER ==================== */}
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
            padding: "16px 24px",
            marginBottom: "20px",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          {/* LEFT: Search & Filters (Grouped Tightly) */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
              flex: 1,
            }}
          >
            <div
              style={{
                position: "relative",
                minWidth: "200px",
                maxWidth: "300px",
                flex: 1,
              }}
            >
              <Search
                size={16}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "12px",
                  transform: "translateY(-50%)",
                  color: "var(--teal)",
                }}
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 38px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  background: "#f9fafb",
                }}
              />
            </div>

            {/* Compact Filter Group */}
            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ width: "140px" }}>
                <SearchableDropdown
                  options={uniqueLocations}
                  value={searchLocation}
                  onChange={setSearchLocation}
                  placeholder="Location"
                  icon={MapPin}
                />
              </div>
              <div style={{ width: "140px" }}>
                <SearchableDropdown
                  options={uniqueProfessors}
                  value={professorFilter}
                  onChange={setProfessorFilter}
                  placeholder="Professor"
                  icon={Users}
                />
              </div>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{
                  width: "130px",
                  padding: "8px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  fontSize: "13px",
                }}
              />
            </div>

            <button
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
              className="btn-primary"
              style={{
                padding: "10px 20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderRadius: "10px",
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

          {/* RIGHT: Actions (Docs, Notifications, Create) */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              alignItems: "center",
              marginLeft: "20px",
            }}
          >
            <NotificationsDropdown />

            {(userRole === "admin" || userRole === "events_office") && (
              <button
                onClick={async () => {
                  setDocsList([]);
                  try {
                    const token = localStorage.getItem("token");

                    const [bRes, boRes] = await Promise.all([
                      fetch("/api/bazaar-applications", {
                        headers: { Authorization: `Bearer ${token}` },
                      }),
                      fetch("/api/booth-applications", {
                        headers: { Authorization: `Bearer ${token}` },
                      }),
                    ]);

                    const bJson = await (bRes.ok ? bRes.json() : []);
                    const boJson = await (boRes.ok ? boRes.json() : []);

                    const gather = (arr) => {
                      if (!Array.isArray(arr)) return [];
                      return arr.flatMap((r) =>
                        (r.attendees || [])
                          .filter((a) => a?.idDocument)
                          .map((a) => ({
                            name: a.name || "No Name",
                            email: a.email || "",
                            url: a.idDocument.startsWith("/")
                              ? `${window.location.origin}${a.idDocument}`
                              : a.idDocument,
                          }))
                      );
                    };

                    setDocsList([...gather(bJson), ...gather(boJson)]);
                    setDocsModalOpen(true);
                  } catch (err) {
                    console.error("Error fetching docs:", err);
                    setToast({ open: true, text: "Failed to load documents" });
                  }
                }}
                className="btn-primary"
                style={{
                  padding: "10px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  borderRadius: "10px",
                }}
              >
                <FileText size={18} />
                <span>Documents</span>
              </button>
            )}

            {/* UNIFIED CREATE BUTTON */}
            <div style={{ position: "relative" }} ref={createMenuRef}>
              <button
                onClick={() => setCreateMenuOpen(!createMenuOpen)}
                className="btn-primary"
                style={{
                  padding: "10px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  borderRadius: "10px",
                }}
              >
                <Plus size={18} />
                <span>Create New</span>
              </button>

              {createMenuOpen && (
                <div style={dropdownMenuStyle}>
                  <button
                    style={dropdownItemStyle}
                    onClick={() => {
                      setChooseOpen(true);
                      setCreateMenuOpen(false);
                    }}
                  >
                    <Calendar size={16} /> Event
                  </button>
                  <button
                    style={dropdownItemStyle}
                    onClick={() => {
                      navigate("/gym-manager");
                      setCreateMenuOpen(false);
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>💪</span> Gym Class
                  </button>
                  <button
                    style={dropdownItemStyle}
                    onClick={() => {
                      navigate("/create-poll");
                      setCreateMenuOpen(false);
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>📊</span> Poll
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Welcome & Pagination Row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "-10px",
            marginBottom: "20px",
          }}
        >
          <div>
            <h1
              style={{
                color: "var(--navy)",
                fontWeight: 800,
                marginBottom: "4px",
                fontSize: "24px",
              }}
            >
              Welcome back, Events Office
            </h1>
            <p className="eo-sub" style={{ margin: 0 }}>
              Manage and organize all GUC events.
            </p>
          </div>
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

        {/* ==================== EVENTS GRID ==================== */}
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
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
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
              if (ev.type === "BOOTH") cardImage = ev.image || boothPlaceholder;
              const id = ev._id;
              const typeRaw = ev.type?.toUpperCase() || "EVENT";
              const title = ev.title || ev.name || "Untitled";
              const editable = isEditable(ev.startDateTime || ev.startDate);
              const isPast = isPastEvent(ev);

              // Helper to close specific menu
              const closeMenu = () => setActiveCardMenu(null);

              return (
                <article
                  key={id}
                  className="card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "400px",
                    position: "relative",
                  }}
                >
                  {/* Image */}
                  <div
                    style={{
                      height: "180px",
                      width: "100%",
                      position: "relative",
                    }}
                  >
                    <img
                      src={cardImage}
                      alt={title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "12px 12px 0 0",
                      }}
                    />
                    <div
                      className="chip"
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        background: "rgba(255,255,255,0.9)",
                      }}
                    >
                      {typeRaw}
                    </div>
                    {ev.status === "archived" && (
                      <div
                        className="chip"
                        style={{
                          position: "absolute",
                          top: "12px",
                          left: "12px",
                          background: "#444",
                          color: "white",
                        }}
                      >
                        ARCHIVED
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      padding: "16px",
                      flexGrow: 1,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <h3
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "18px",
                        fontWeight: "700",
                        color: "var(--navy)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {title}
                    </h3>

                    {/* Simplified Metadata */}
                    {ev.type !== "BOOTH" && (
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#666",
                          marginBottom: "4px",
                        }}
                      >
                        <Calendar
                          size={12}
                          style={{ display: "inline", marginRight: "6px" }}
                        />
                        {ev.startDateTime
                          ? new Date(ev.startDateTime).toLocaleDateString()
                          : "TBD"}
                      </div>
                    )}
                    {ev.location && (
                      <div style={{ fontSize: "13px", color: "#666" }}>
                        <MapPin
                          size={12}
                          style={{ display: "inline", marginRight: "6px" }}
                        />
                        {ev.location}
                      </div>
                    )}

                    {/* Restriction Badge */}
                    {ev.allowedRoles && ev.allowedRoles.length > 0 && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "6px 10px",
                          background: "#e3f2fd",
                          borderRadius: "4px",
                          fontSize: "12px",
                          color: "#1976d2",
                          fontWeight: "500",
                        }}
                      >
                        🔒 Restricted to: {ev.allowedRoles.join(", ")}
                      </div>
                    )}

                    <div
                      style={{
                        marginTop: "auto",
                        paddingTop: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      {/* PRIMARY ACTION BUTTON */}
                      <button
                        className="btn-outline"
                        style={{
                          padding: "10px 24px",
                          fontSize: "14px",
                          flex: 1,
                          textAlign: "center",
                          background: "#567c8d",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = "#45687a";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = "#567c8d";
                        }}
                        onClick={() => setViewEvent(ev)}
                      >
                        View Details
                      </button>

                      {/* KEBAB MENU TRIGGER */}
                      <div
                        className="card-menu-container"
                        style={{ position: "relative", marginLeft: "8px" }}
                      >
                        <button
                          style={{
                            ...menuBtnStyle,
                            background:
                              activeCardMenu === id ? "#eee" : "transparent",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCardMenu(
                              activeCardMenu === id ? null : id
                            );
                          }}
                        >
                          <MoreVertical size={20} />
                        </button>

                        {activeCardMenu === id && (
                          <div
                            style={{
                              ...dropdownMenuStyle,
                              top: "auto",
                              bottom: "100%",
                              right: 0,
                              marginBottom: "8px",
                            }}
                          >
                            {/* Edit Logic */}
                            {editable &&
                              ev.status !== "archived" &&
                              typeRaw !== "WORKSHOP" &&
                              typeRaw !== "BOOTH" && (
                                <button
                                  style={dropdownItemStyle}
                                  onClick={() => {
                                    const pathMap = {
                                      WORKSHOP: "workshops",
                                      TRIP: "trips",
                                      CONFERENCE: "conferences",
                                      BAZAAR: "bazaars",
                                    };
                                    navigate(
                                      `/${pathMap[typeRaw] || "events"}/${id}`
                                    );
                                  }}
                                >
                                  <span>Edit Event</span>
                                </button>
                              )}

                            {/* Specific Workshop Actions */}
                            {typeRaw === "WORKSHOP" &&
                              ev.status !== "archived" &&
                              (ev.status === "pending" ||
                                ev.status === "edits_requested") && (
                                <>
                                  <button
                                    style={{
                                      ...dropdownItemStyle,
                                      color: "green",
                                    }}
                                    onClick={() => {
                                      handleAccept(id);
                                      closeMenu();
                                    }}
                                  >
                                    Accept & Publish
                                  </button>
                                  <button
                                    style={{
                                      ...dropdownItemStyle,
                                      color: "orange",
                                    }}
                                    onClick={() => {
                                      handleRequestEdits(id);
                                      closeMenu();
                                    }}
                                  >
                                    Request Edits
                                  </button>
                                  <button
                                    style={{
                                      ...dropdownItemStyle,
                                      color: "red",
                                    }}
                                    onClick={() => {
                                      handleReject(id);
                                      closeMenu();
                                    }}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                            {/* Restrictions - only for WORKSHOP and CONFERENCE */}
                            {typeRaw !== "BAZAAR" && typeRaw !== "BOOTH" && (
                              <button
                                style={dropdownItemStyle}
                                onClick={() => {
                                  handleOpenRestriction(
                                    id,
                                    typeRaw,
                                    ev.allowedRoles
                                  );
                                  closeMenu();
                                }}
                              >
                                <Users size={14} /> Roles/Restriction
                              </button>
                            )}

                            {/* Export */}
                            <button
                              style={dropdownItemStyle}
                              onClick={() => {
                                exportAttendees(
                                  id,
                                  typeRaw.toLowerCase() + "s"
                                );
                                closeMenu();
                              }}
                            >
                              <Download size={14} /> Export List
                            </button>

                            {/* Vendor Requests (Bazaar) */}
                            {typeRaw === "BAZAAR" && (
                              <button
                                style={dropdownItemStyle}
                                onClick={() => {
                                  navigate(
                                    `/bazaars/${ev._id}/vendor-requests`
                                  );
                                  closeMenu();
                                }}
                              >
                                Vendor Requests
                              </button>
                            )}

                            {/* Archive */}
                            {isPast && ev.status !== "archived" && (
                              <button
                                style={dropdownItemStyle}
                                onClick={() => {
                                  handleArchive(id, typeRaw);
                                  closeMenu();
                                }}
                              >
                                <Archive size={14} /> Archive
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              style={{
                                ...dropdownItemStyle,
                                color: "#d32f2f",
                                borderTop: "1px solid #eee",
                              }}
                              onClick={() => {
                                handleDelete(id, typeRaw.toLowerCase() + "s");
                                closeMenu();
                              }}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      {/* ===== Modals (Confirm, EditRequest, Restriction, ChooseType, Docs, Viewer) ===== */}
      {/* (These remain largely the same, included below for completeness) */}
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
                {confirm.cancelLabel}
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  confirm.onConfirm && confirm.onConfirm();
                  setConfirm((c) => ({ ...c, open: false }));
                }}
              >
                {confirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
      {editRequest.open && (
        <div className="confirm-overlay" role="dialog">
          <div className="confirm">
            <h2>Request Edits</h2>
            <textarea
              value={editRequest.message}
              onChange={(e) =>
                setEditRequest({ ...editRequest, message: e.target.value })
              }
              className="w-full h-32 p-2 border border-gray-300 rounded"
              placeholder="Message..."
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
              <button className="btn btn-primary" onClick={doRequestEdits}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}
      {restrictionModal.open && (
        <div className="confirm-overlay" role="dialog">
          <div className="confirm" style={{ maxWidth: "400px" }}>
            <h3>Manage Roles</h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                margin: "20px 0",
              }}
            >
              {["student", "professor", "ta", "staff"].map((role) => (
                <label
                  key={role}
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={restrictionModal.currentRoles.includes(role)}
                    onChange={() => handleToggleRole(role)}
                  />
                  <span style={{ textTransform: "capitalize" }}>{role}</span>
                </label>
              ))}
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
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {chooseOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full animate-scale-in">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">New Event</h3>
            </div>
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
                  className={`flex-1 flex flex-col items-center p-3 rounded-lg border-2 ${color}`}
                >
                  <span className="text-2xl mb-1">{icon}</span>
                  <span className="font-medium text-xs">{label}</span>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setChooseOpen(false)}
                className="w-full py-2 text-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* View Event Modal (Simplified for brevity, logic preserved) */}
      {viewEvent && (
        <div className="confirm-overlay" role="dialog">
          <div
            style={{
              background: "white",
              padding: "24px",
              width: "600px",
              maxHeight: "85vh",
              overflowY: "auto",
              borderRadius: "12px",
              position: "relative",
            }}
          >
            <button
              onClick={() => setViewEvent(null)}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                border: "none",
                background: "none",
                fontSize: "24px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ×
            </button>

            <h2
              style={{
                marginRight: "30px",
                marginBottom: "4px",
                color: "var(--navy)",
              }}
            >
              {viewEvent.title || viewEvent.name}
            </h2>

            <div
              style={{
                color: "#567c8d",
                marginBottom: "16px",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              {viewEvent.type}
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              {/* For TRIPS: Only show Capacity, Pricing, Start & End, Deadline, Description, Location */}
              {viewEvent.type === "TRIP" ? (
                <>
                  {/* Start & End Date/Time */}
                  {(viewEvent.startDateTime || viewEvent.startDate) && (
                    <div
                      style={{
                        borderBottom: "1px solid #eee",
                        paddingBottom: "12px",
                      }}
                    >
                      <strong style={{ color: "var(--navy)" }}>
                        📅 Start & End:
                      </strong>
                      <div
                        style={{
                          color: "#666",
                          marginTop: "4px",
                          fontSize: "14px",
                        }}
                      >
                        {formatDate(
                          viewEvent.startDateTime || viewEvent.startDate
                        )}
                        {(viewEvent.endDateTime || viewEvent.endDate) && (
                          <>
                            {" → "}
                            {formatDate(
                              viewEvent.endDateTime || viewEvent.endDate
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Deadline */}
                  {viewEvent.registrationDeadline && (
                    <div
                      style={{
                        borderBottom: "1px solid #eee",
                        paddingBottom: "12px",
                      }}
                    >
                      <strong style={{ color: "var(--navy)" }}>
                        ⏰ Registration Deadline:
                      </strong>
                      <div
                        style={{
                          color: "#666",
                          marginTop: "4px",
                          fontSize: "14px",
                        }}
                      >
                        {formatDate(viewEvent.registrationDeadline)}
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {viewEvent.location && (
                    <div
                      style={{
                        borderBottom: "1px solid #eee",
                        paddingBottom: "12px",
                      }}
                    >
                      <strong style={{ color: "var(--navy)" }}>
                        📍 Location:
                      </strong>
                      <div
                        style={{
                          color: "#666",
                          marginTop: "4px",
                          fontSize: "14px",
                        }}
                      >
                        {viewEvent.location}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {(viewEvent.description || viewEvent.shortDescription) && (
                    <div
                      style={{
                        borderBottom: "1px solid #eee",
                        paddingBottom: "12px",
                      }}
                    >
                      <strong style={{ color: "var(--navy)" }}>
                        📝 Description:
                      </strong>
                      <div
                        style={{
                          color: "#666",
                          marginTop: "4px",
                          fontSize: "14px",
                          lineHeight: "1.5",
                        }}
                      >
                        {viewEvent.description || viewEvent.shortDescription}
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  {viewEvent.price != null && (
                    <div
                      style={{
                        borderBottom: "1px solid #eee",
                        paddingBottom: "12px",
                      }}
                    >
                      <strong style={{ color: "var(--navy)" }}>
                        💰 Pricing:
                      </strong>
                      <div
                        style={{
                          color: "#666",
                          marginTop: "4px",
                          fontSize: "14px",
                        }}
                      >
                        {formatMoney(viewEvent.price)}
                      </div>
                    </div>
                  )}

                  {/* Capacity */}
                  {viewEvent.capacity && (
                    <div style={{ paddingTop: "12px" }}>
                      <strong style={{ color: "var(--navy)" }}>
                        👥 Capacity:
                      </strong>
                      <div
                        style={{
                          color: "#666",
                          marginTop: "4px",
                          fontSize: "14px",
                        }}
                      >
                        {viewEvent.capacity}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* For other event types, show all details */}
                  {/* Date/Time */}
                  {viewEvent.type !== "BOOTH" &&
                    (viewEvent.startDateTime || viewEvent.startDate) && (
                      <div
                        style={{
                          borderBottom: "1px solid #eee",
                          paddingBottom: "12px",
                        }}
                      >
                        <strong style={{ color: "var(--navy)" }}>
                          📅 Date & Time:
                        </strong>
                        <div
                          style={{
                            color: "#666",
                            marginTop: "4px",
                            fontSize: "14px",
                          }}
                        >
                          {formatDate(
                            viewEvent.startDateTime || viewEvent.startDate
                          )}
                          {(viewEvent.endDateTime || viewEvent.endDate) && (
                            <>
                              {" → "}
                              {formatDate(
                                viewEvent.endDateTime || viewEvent.endDate
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Location */}
                  {viewEvent.location && (
                    <div
                      style={{
                        borderBottom: "1px solid #eee",
                        paddingBottom: "12px",
                      }}
                    >
                      <strong style={{ color: "var(--navy)" }}>
                        📍 Location:
                      </strong>
                      <div
                        style={{
                          color: "#666",
                          marginTop: "4px",
                          fontSize: "14px",
                        }}
                      >
                        {viewEvent.location}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {(viewEvent.description || viewEvent.shortDescription) && (
                    <div
                      style={{
                        borderBottom: "1px solid #eee",
                        paddingBottom: "12px",
                      }}
                    >
                      <strong style={{ color: "var(--navy)" }}>
                        📝 Description:
                      </strong>
                      <div
                        style={{
                          color: "#666",
                          marginTop: "4px",
                          fontSize: "14px",
                          lineHeight: "1.5",
                        }}
                      >
                        {viewEvent.description || viewEvent.shortDescription}
                      </div>
                    </div>
                  )}

                  {/* Professor/Faculty */}
                  {(viewEvent.professorsParticipating ||
                    viewEvent.facultyResponsible) && (
                    <div
                      style={{
                        borderBottom: "1px solid #eee",
                        paddingBottom: "12px",
                      }}
                    >
                      <strong style={{ color: "var(--navy)" }}>
                        👨‍🏫 Professor:
                      </strong>
                      <div
                        style={{
                          color: "#666",
                          marginTop: "4px",
                          fontSize: "14px",
                        }}
                      >
                        {viewEvent.professorsParticipating ||
                          viewEvent.facultyResponsible}
                      </div>
                    </div>
                  )}

                  {/* Faculty Responsible (Workshops only) */}
                  {viewEvent.type === "WORKSHOP" &&
                    viewEvent.facultyResponsible && (
                      <div
                        style={{
                          borderBottom: "1px solid #eee",
                          paddingBottom: "12px",
                        }}
                      >
                        <strong style={{ color: "var(--navy)" }}>
                          👨‍💼 Faculty Responsible:
                        </strong>
                        <div
                          style={{
                            color: "#666",
                            marginTop: "4px",
                            fontSize: "14px",
                          }}
                        >
                          {viewEvent.facultyResponsible}
                        </div>
                      </div>
                    )}

                  {/* Agenda */}
                  {(viewEvent.agenda || viewEvent.fullAgenda) && (
                    <div
                      style={{
                        borderBottom: "1px solid #eee",
                        paddingBottom: "12px",
                      }}
                    >
                      <strong style={{ color: "var(--navy)" }}>
                        📋 Agenda:
                      </strong>
                      <div
                        style={{
                          color: "#666",
                          marginTop: "4px",
                          fontSize: "14px",
                          lineHeight: "1.5",
                        }}
                      >
                        {viewEvent.agenda || viewEvent.fullAgenda}
                      </div>
                    </div>
                  )}

                  {/* Capacity/Registrations */}
                  {(viewEvent.capacity || viewEvent.registrations?.length) && (
                    <div
                      style={{
                        borderBottom: "1px solid #eee",
                        paddingBottom: "12px",
                      }}
                    >
                      <strong style={{ color: "var(--navy)" }}>
                        👥{" "}
                        {viewEvent.type === "WORKSHOP"
                          ? "Capacity:"
                          : "Registrations:"}
                      </strong>
                      <div
                        style={{
                          color: "#666",
                          marginTop: "4px",
                          fontSize: "14px",
                        }}
                      >
                        {viewEvent.type === "WORKSHOP"
                          ? `${viewEvent.capacity || "N/A"} capacity`
                          : `${
                              viewEvent.registrations?.length || 0
                            } registered${
                              viewEvent.capacity
                                ? ` / ${viewEvent.capacity} capacity`
                                : ""
                            }`}
                      </div>
                    </div>
                  )}

                  {/* Budget/Price */}
                  {(viewEvent.budget || viewEvent.price) && (
                    <div
                      style={{
                        borderBottom: "1px solid #eee",
                        paddingBottom: "12px",
                      }}
                    >
                      <strong style={{ color: "var(--navy)" }}>
                        💰 {viewEvent.type === "TRIP" ? "Price" : "Budget"}:
                      </strong>
                      <div
                        style={{
                          color: "#666",
                          marginTop: "4px",
                          fontSize: "14px",
                        }}
                      >
                        {formatMoney(viewEvent.budget || viewEvent.price)}
                      </div>
                    </div>
                  )}

                  {/* Funding Source */}
                  {viewEvent.fundingSource && (
                    <div
                      style={{
                        borderBottom: "1px solid #eee",
                        paddingBottom: "12px",
                      }}
                    >
                      <strong style={{ color: "var(--navy)" }}>
                        💳 Funding Source:
                      </strong>
                      <div
                        style={{
                          color: "#666",
                          marginTop: "4px",
                          fontSize: "14px",
                        }}
                      >
                        {viewEvent.fundingSource}
                      </div>
                    </div>
                  )}

                  {/* Extra Resources */}
                  {viewEvent.extraResources && (
                    <div
                      style={{
                        borderBottom: "1px solid #eee",
                        paddingBottom: "12px",
                      }}
                    >
                      <strong style={{ color: "var(--navy)" }}>
                        📦 Extra Resources:
                      </strong>
                      <div
                        style={{
                          color: "#666",
                          marginTop: "4px",
                          fontSize: "14px",
                          lineHeight: "1.5",
                        }}
                      >
                        {viewEvent.extraResources}
                      </div>
                    </div>
                  )}

                  {/* Workshop Specific */}
                  {viewEvent.type === "WORKSHOP" && (
                    <>
                      {viewEvent.registrationDeadline && (
                        <div
                          style={{
                            borderBottom: "1px solid #eee",
                            paddingBottom: "12px",
                          }}
                        >
                          <strong style={{ color: "var(--navy)" }}>
                            ⏰ Registration Deadline:
                          </strong>
                          <div
                            style={{
                              color: "#666",
                              marginTop: "4px",
                              fontSize: "14px",
                            }}
                          >
                            {formatDate(viewEvent.registrationDeadline)}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Booth Specific */}
                  {viewEvent.type === "BOOTH" && (
                    <>
                      {viewEvent.boothSize && (
                        <div
                          style={{
                            borderBottom: "1px solid #eee",
                            paddingBottom: "12px",
                          }}
                        >
                          <strong style={{ color: "var(--navy)" }}>
                            📐 Booth Size:
                          </strong>
                          <div
                            style={{
                              color: "#666",
                              marginTop: "4px",
                              fontSize: "14px",
                            }}
                          >
                            {viewEvent.boothSize}
                          </div>
                        </div>
                      )}
                      {viewEvent.duration && (
                        <div
                          style={{
                            borderBottom: "1px solid #eee",
                            paddingBottom: "12px",
                          }}
                        >
                          <strong style={{ color: "var(--navy)" }}>
                            ⏳ Duration:
                          </strong>
                          <div
                            style={{
                              color: "#666",
                              marginTop: "4px",
                              fontSize: "14px",
                            }}
                          >
                            {viewEvent.duration} weeks
                          </div>
                        </div>
                      )}
                      {viewEvent.platformSlot && (
                        <div
                          style={{
                            borderBottom: "1px solid #eee",
                            paddingBottom: "12px",
                          }}
                        >
                          <strong style={{ color: "var(--navy)" }}>
                            🎯 Platform Slot:
                          </strong>
                          <div
                            style={{
                              color: "#666",
                              marginTop: "4px",
                              fontSize: "14px",
                            }}
                          >
                            {viewEvent.platformSlot}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Conference Specific */}
                  {viewEvent.type === "CONFERENCE" && viewEvent.website && (
                    <div
                      style={{
                        borderBottom: "1px solid #eee",
                        paddingBottom: "12px",
                      }}
                    >
                      <strong style={{ color: "var(--navy)" }}>
                        🌐 Website:
                      </strong>
                      <div
                        style={{
                          color: "#666",
                          marginTop: "4px",
                          fontSize: "14px",
                        }}
                      >
                        <a
                          href={viewEvent.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#567c8d", textDecoration: "none" }}
                        >
                          {viewEvent.website}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Status - Only for workshops */}
                  {viewEvent.status && viewEvent.type === "WORKSHOP" && (
                    <div style={{ paddingTop: "12px" }}>
                      <strong style={{ color: "var(--navy)" }}>Status:</strong>
                      <div
                        style={{
                          marginTop: "4px",
                          fontSize: "14px",
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: "16px",
                          background:
                            viewEvent.status === "archived"
                              ? "#f0f0f0"
                              : viewEvent.status === "published"
                              ? "#e8f5e9"
                              : "#fff3e0",
                          color:
                            viewEvent.status === "archived"
                              ? "#666"
                              : viewEvent.status === "published"
                              ? "#2e7d32"
                              : "#f57c00",
                          fontWeight: "600",
                          textTransform: "capitalize",
                        }}
                      >
                        {viewEvent.status}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Ratings & Review Button */}
              <div
                style={{
                  marginTop: "20px",
                  paddingTop: "12px",
                  borderTop: "1px solid #eee",
                }}
              >
                <button
                  onClick={() => {
                    navigate(`/event-reviews/${viewEvent._id}`);
                    setViewEvent(null);
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "var(--teal)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#4a9b8e";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "var(--teal)";
                  }}
                >
                  <Star size={18} />
                  View Ratings & Reviews
                </button>
              </div>
            </div>
          </div>
        </div>
      )}{" "}
      {docsModalOpen && (
        <div className="confirm-overlay" role="dialog">
          <div
            style={{
              background: "white",
              width: "600px",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "15px",
                background: "#f0f0f0",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <strong>Documents</strong>
              <button
                onClick={() => setDocsModalOpen(false)}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{ maxHeight: "400px", overflowY: "auto", padding: "15px" }}
            >
              {docsList.map((d, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <span>{d.name}</span>
                  <div>
                    <button
                      onClick={() => openViewer(d.url, d.name)}
                      style={{
                        marginRight: "10px",
                        color: "blue",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => downloadFile(d.url, d.name)}
                      style={{
                        color: "green",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
              {docsList.length === 0 && <p>No documents found.</p>}
            </div>
          </div>
        </div>
      )}
      {viewerOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "80%",
              height: "80%",
              background: "white",
              position: "relative",
            }}
          >
            <button
              onClick={() => setViewerOpen(false)}
              style={{
                position: "absolute",
                top: -30,
                right: 0,
                color: "white",
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
            <iframe
              src={viewerUrl}
              style={{ width: "100%", height: "100%", border: "none" }}
              title="Doc Viewer"
            />
          </div>
        </div>
      )}
      {toast.open && (
        <div className="eo-toast" role="status">
          <span className="eo-toast-text">{toast.text}</span>
          <button
            className="eo-toast-x"
            onClick={() => setToast({ open: false, text: "" })}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
