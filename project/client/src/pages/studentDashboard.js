// client/src/pages/StudentDashboard.js

import React, { useState, useEffect ,useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import workshopPlaceholder from "../images/workshop.png";
import boothPlaceholder from "../images/booth.jpg";
import conferenceImg from "../images/Conferenceroommeetingconcept.jpeg";
import tripImg from "../images/Womanlookingatmapplanningtrip.jpeg";
import bazaarImg from "../images/Arabbazaarisolatedonwhitebackground_FreeVector.jpeg";
import workshopImg from "../images/download(12).jpeg";

import {
  Search,
  Menu,
  Bell,
  User,
  Calendar,
  Heart,
  MapPin,
  Clock,
  TrendingUp,
  Users,
  ArrowUp,
  ArrowDown,
  Mic,
  MicOff,        // ⬅ new icons
} from "lucide-react";

import StudentSidebar from "../components/StudentSidebar";
import EventTypeDropdown from "../components/EventTypeDropdown";
import SearchableDropdown from "../components/SearchableDropdown";
import { handleVoiceCommand } from "../utils/VoiceCommands";

const API_BASE = "http://localhost:3000"; // Your working backend

const StudentDashboard = () => {
  const navigate = useNavigate();

  const API =
    process.env.REACT_APP_API_URL?.replace(/\/$/, "") ||
    "http://localhost:3001";

  const [searchTerm, setSearchTerm] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [professorFilter, setProfessorFilter] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  // const [isSidebarOpen, setIsSidebarOpen] = useState(false);
// NEW: keep track if assistant should keep listening
const [assistantActive, setAssistantActive] = useState(false);
const assistantActiveRef = useRef(false);
const lastConfirmationRef = useRef("");

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [userId, setUserId] = useState(null);
  const debouncedSearch = useDebounce(searchTerm, 400);
const debouncedLocation = useDebounce(searchLocation, 400);
const debouncedProfessor = useDebounce(professorFilter, 400);
const debouncedEventType = useDebounce(eventTypeFilter, 400);
const debouncedDate = useDebounce(dateFilter, 400);
  const [isListening, setIsListening] = useState(false);
  // const [awaitingCommand, setAwaitingCommand] = useState(false); // after wake word
  const [voiceStatus, setVoiceStatus] = useState("");            // small helper text
  const recognitionRef = useRef(null);
  const [lastTranscript, setLastTranscript] = useState("");
  const keepListeningRef = useRef(false); 
  
useEffect(() => {
  assistantActiveRef.current = assistantActive;
}, [assistantActive]);

 const speak = useCallback((text, onEnd) => {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 1;
  utterance.pitch = 1;

  if (onEnd) {
    utterance.onend = onEnd;
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}, []);


   const startVoiceAssistant = useCallback(() => {
  const recognition = recognitionRef.current;
  if (!recognition) {
    alert("Voice recognition is not supported in this browser.");
    return;
  }

  // If already active -> turn off
  if (assistantActiveRef.current) {
    setAssistantActive(false);
    setVoiceStatus("Stopped listening.");
    window.speechSynthesis.cancel();
    recognition.stop();
    return;
  }

  // Turn ON
  setAssistantActive(true);
  setVoiceStatus("Starting voice assistant...");
  window.speechSynthesis.cancel();

  // Greet, then start listening
  speak("Hello, how can I help you?", () => {
    try {
      recognition.start();
    } catch (e) {
      console.error("Recognition start error:", e);
      setVoiceStatus("Could not start listening.");
      setAssistantActive(false);
    }
  });
});


  useEffect(() => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn("SpeechRecognition not supported in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false; // one phrase at a time, we'll manually restart

  recognition.onstart = () => {
    setIsListening(true);
    setVoiceStatus("Listening for your command...");
  };

  recognition.onend = () => {
    setIsListening(false);

    // If assistant is OFF, do nothing
    if (!assistantActiveRef.current) return;

    // If we have something to say from the last command
    if (lastConfirmationRef.current) {
      const msg = lastConfirmationRef.current;
      lastConfirmationRef.current = "";
      setVoiceStatus(msg);
      speak(msg, () => {
        // after speaking, if still active, listen again
        if (assistantActiveRef.current) {
          try {
            recognition.start();
          } catch (e) {
            console.error("Recognition restart error:", e);
          }
        }
      });
    } else {
      // No message this round, just restart listening silently
      if (assistantActiveRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.error("Recognition restart error:", e);
        }
      }
    }
  };

  recognition.onerror = (event) => {
    console.error("Voice error:", event.error);
    setIsListening(false);
    setVoiceStatus("Voice error. Try again.");
  };

  recognition.onresult = (event) => {
    const raw = event.results[0][0].transcript;
    const transcript = raw.toLowerCase().replace(/[.!?]+$/g, "").trim(); // 🔥 strip dot
    console.log("Heard:", transcript);
    setLastTranscript(transcript);

    const confirmation = handleVoiceCommand(transcript, navigate, {
      setSearchTerm,
      setEventTypeFilter,
      setSearchLocation,
      setProfessorFilter,
      setDateFilter,
       events: allEvents,   
    });

    // queue confirmation for onend
    lastConfirmationRef.current = confirmation || "";
  };

  recognitionRef.current = recognition;

  return () => {
    assistantActiveRef.current = false;
    setAssistantActive(false);
    recognition.onend = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onstart = null;
    recognition.stop();
  };
}, [
  navigate,
  setSearchTerm,
  setEventTypeFilter,
  setSearchLocation,
  setProfessorFilter,
  setDateFilter,
   allEvents, 
  speak,
]);


useEffect(() => {
  const handleKeyDown = (e) => {
    // e.g. press "v" to start/stop Eventity
    if (e.key.toLowerCase() === "v") {
      startVoiceAssistant();
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [startVoiceAssistant]);

  /* ---------------------- Fetch Events ---------------------- */
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();

        if (debouncedSearch) params.append("search", debouncedSearch);
if (debouncedLocation) params.append("location", debouncedLocation);
if (debouncedProfessor) params.append("professor", debouncedProfessor);
if (debouncedEventType !== "All") params.append("type", debouncedEventType);
if (debouncedDate) params.append("date", debouncedDate);


        params.append("sort", "startDateTime");
        params.append("order", sortOrder === "asc" ? "desc" : "asc");
        const res = await fetch(`${API}/api/events/all?${params}`);
        const data = await res.json();
        if (res.ok) {
          const cleanData = data.filter(
            (e) => e.status?.toLowerCase() !== "archived"
          );
          const normalized = cleanData.map((e) => {
  if (e.type === "BOOTH") {
    return {
      _id: e._id,
      type: "BOOTH",
      title: e.attendees?.[0]?.name || `Booth ${e._id}`,
      image: e.image || boothPlaceholder,
      description: e.description || "",
      startDateTime: e.startDateTime,
      endDateTime: e.endDateTime,
      date: e.startDateTime,
      location: e.location,
      allowedRoles: e.allowedRoles || [],
    };
  }

  // return all other event types unchanged
  return e;
});

setAllEvents(normalized);

        } else {
          setAllEvents([]);
        }
      } catch (err) {
        console.error(err);
        setAllEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [
  debouncedSearch,
  debouncedLocation,
  debouncedProfessor,
  debouncedEventType,
  debouncedDate,
  sortOrder,
  API,
]
);

  /* ---------------------- Extract Unique Filter Options ---------------------- */
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

  /* ---------------------- Fetch Favorites ---------------------- */

  // Get user ID from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserId(payload.id || payload.userId || payload._id);
      } catch (e) {
        console.error("Invalid token");
      }
    }
  }, []);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch("/api/users/me/favorites", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setFavorites(data.map((e) => e._id));
        }
      } catch (err) {
        console.error("Failed to fetch favorites", err);
      }
    };

    fetchFavorites();

    // Re-fetch favorites when window regains focus (user returns from another page)
    const handleFocus = () => fetchFavorites();
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  /* ---------------------- Favorite Toggle ---------------------- */

  const toggleFavorite = async (eventId) => {
    const method = favorites.includes(eventId) ? "DELETE" : "POST";

    const url = `/api/users/me/favorites${
      method === "DELETE" ? `/${eventId}` : ""
    }`;

    try {
      const token = localStorage.getItem("token");
      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : { "Content-Type": "application/json" };

      await fetch(url, {
        method,
        headers,
        body: method === "POST" ? JSON.stringify({ eventId }) : undefined,
      });

      setFavorites((prev) =>
        prev.includes(eventId)
          ? prev.filter((id) => id !== eventId)
          : [...prev, eventId]
      );
    } catch (err) {
      console.error("Favorite toggle failed", err);
    }
  };

  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      try {
        // No token needed anymore
        const res = await fetch(`${API_BASE}/api/notifications/user/${userId}`);

        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        } else {
          console.error("Failed to fetch notifications");
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    };

    fetchNotifications();
  }, [userId]);
  /* ---------------------- UI ---------------------- */

  if (loading) {
    return (
      <div className="flex h-screen bg-[#f5efeb] items-center justify-center">
        <p className="text-[#567c8d]">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="events-theme flex min-h-screen bg-[#f5efeb] ml-[260px]">
      {/* ---- FIXED SIDEBAR ---- */}
      <StudentSidebar />

      {/* ---- MAIN CONTENT ---- */}
      <div className="flex-1 flex flex-col overflow-auto bg-[#f5efeb]">
        {/* Header */}
        <header className="bg-white border-b border-[#c8d9e6] px-2 md:px-4 py-4 flex items-center justify-between">
          {/* <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-[#f5efeb] rounded-lg md:hidden"
          >
            <Menu size={24} className="text-[#2f4156]" />
          </button> */}

          {/* Search + Filters */}
          <div className="flex flex-col md:flex-row gap-2 flex-1 mx-4">
            <div className="relative md:w-48 flex-shrink-0">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#567c8d]"
                size={18}
              />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2 text-base border border-[#c8d9e6] rounded-lg"
              />
            </div>

            <div className="md:w-44 flex-shrink-0">
              <SearchableDropdown
                options={uniqueLocations}
                value={searchLocation}
                onChange={setSearchLocation}
                placeholder="All Locations"
                label="Location"
                icon={MapPin}
              />
            </div>

            <div className="md:w-44 flex-shrink-0">
              <SearchableDropdown
                options={uniqueProfessors}
                value={professorFilter}
                onChange={setProfessorFilter}
                placeholder="All Professors"
                label="Professor"
                icon={Users}
              />
            </div>

            <div className="flex-shrink-0">
              <EventTypeDropdown
                selected={eventTypeFilter}
                onChange={setEventTypeFilter}
              />
            </div>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-[#c8d9e6] rounded-lg flex-shrink-0"
            />

            <button
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
              className="px-4 py-2 bg-[#567c8d] text-white rounded-lg whitespace-nowrap flex items-center gap-2"
            >
              {sortOrder === "asc" ? (
                <ArrowUp size={18} />
              ) : (
                <ArrowDown size={18} />
              )}
              {sortOrder === "asc" ? "Oldest" : "Newest"}
            </button>
          </div>

                    {/* User + Notifications + Voice */}
          <div className="flex items-center gap-4">
            {/* Voice Assistant Button */}
            <button
              onClick={startVoiceAssistant}
              className="relative p-2 hover:bg-[#f5efeb] rounded-lg flex items-center gap-2"
            >
              {isListening ? (
                <MicOff size={20} className="text-red-500" />
              ) : (
                <Mic size={20} className="text-[#567c8d]" />
              )}
            </button>

            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-[#f5efeb] rounded-lg"
            >
              <Bell size={20} className="text-[#567c8d]" />

              {notifications.some((n) => n.unread) && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center">
              <User size={20} className="text-[#2f4156]" />
            </div>
          </div>

        </header>

        {showNotifications && (
          <div className="absolute right-6 top-20 bg-white shadow-xl rounded-xl w-80 border border-[#c8d9e6] z-50 p-4 max-h-96 overflow-auto">
            <h3 className="font-bold text-[#2f4156] mb-3">Notifications</h3>

            {notifications.length === 0 ? (
              <p className="text-sm text-[#567c8d]">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-3 mb-2 rounded-lg border ${
                    n.unread
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <p className="text-sm text-[#2f4156]">{n.message}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* ---- PAGE CONTENT ---- */}
        <main className="p-4 md:p-8">
          {/* Header Section with Stats */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-[#2f4156] mb-2">
                  Discover Events
                </h1>
                <p className="text-[#567c8d]">
                  Explore and register for upcoming campus events
                </p>
              </div>

              <button
                onClick={() => navigate("/favorites")}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-[#c8d9e6] rounded-xl hover:border-red-300 hover:bg-red-50 transition-all group shadow-sm"
              >
                <Heart
                  size={20}
                  className={
                    favorites.length > 0
                      ? "fill-red-500 text-red-500"
                      : "text-[#567c8d] group-hover:text-red-500"
                  }
                />
                <span className="font-medium text-[#2f4156]">My Favorites</span>
                {favorites.length > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {favorites.length}
                  </span>
                )}
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium mb-1">
                      Total Events
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {allEvents.length}
                    </p>
                  </div>
                  <div className="bg-blue-200 p-3 rounded-lg">
                    <Calendar size={24} className="text-blue-700" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium mb-1">
                      Favorites
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {favorites.length}
                    </p>
                  </div>
                  <div className="bg-purple-200 p-3 rounded-lg">
                    <Heart size={24} className="text-purple-700" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium mb-1">
                      Event Types
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {
                        new Set(allEvents.map((e) => e.type).filter(Boolean))
                          .size
                      }
                    </p>
                  </div>
                  <div className="bg-green-200 p-3 rounded-lg">
                    <TrendingUp size={24} className="text-green-700" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        {voiceStatus && (
          <div className="px-4 py-2 bg-[#fff8e1] text-[#5d4037] text-sm">
            🎙️ Eventity: {voiceStatus}
          </div>
        )}
        {lastTranscript && (
  <div className="px-4 py-2 bg-[#e3f2fd] text-[#0d47a1] text-xs mt-1">
    👂 Last heard: "{lastTranscript}"
  </div>
)}

          {/* Events Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {allEvents.map((e) => {
              let cardImage = workshopImg;
              if (e.type === "TRIP") cardImage = tripImg;
              if (e.type === "BAZAAR") cardImage = bazaarImg;
              if (e.type === "CONFERENCE") cardImage = conferenceImg;
              if (e.type === "WORKSHOP") cardImage = workshopImg;
              if (e.type === "BOOTH") cardImage = e.image || boothPlaceholder;

              const fallbackImage = cardImage;

              // Format date
              const eventDate = e.startDateTime
                ? new Date(e.startDateTime).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "";
                if (e.type === "BOOTH") {
  return (
    <div
      key={e._id}
      className="bg-[#fdfdfd] border border-[#c8d9e6] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="h-40 w-full bg-gray-200 relative">
        <img
          src={e.image || boothPlaceholder}
          alt={e.title}
          className="h-full w-full object-cover"
          onError={(target) => {
            target.target.src = boothPlaceholder;
          }}
        />
        <button
          onClick={(ev) => {
            ev.stopPropagation();
            toggleFavorite(e._id);
          }}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
        >
          <Heart
            size={18}
            className={
              favorites.includes(e._id)
                ? "fill-red-500 text-red-500"
                : "text-gray-600"
            }
          />
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg text-[#2f4156] truncate">
          {e.title || "Booth"}
        </h3>

        <p className="text-sm text-[#567c8d] truncate">Type: BOOTH</p>

        <p className="text-sm text-[#567c8d]">
          Date:{" "}
          {new Date(e.startDateTime || e.date).toLocaleDateString()}
        </p>

        {e.location && (
          <p className="text-sm text-[#567c8d] truncate">Location: {e.location}</p>
        )}

        <div className="flex gap-2 mt-4">
          <button
            className="flex-1 bg-[#567c8d] hover:bg-[#45687a] text-white py-2 px-3 rounded-lg transition-colors"
            onClick={() => navigate(`/events/${e._id}`)}
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
}


              return (
                <div
                  key={e._id}
                  className="bg-white border border-[#c8d9e6] rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  <div className="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                    <img
                      src={e.image || fallbackImage}
                      alt={e.title}
                      className="h-full w-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />

                    {/* Event Type Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/90 backdrop-blur-sm text-[#2f4156] px-3 py-1.5 rounded-full text-xs font-semibold shadow-md">
                        {e.type}
                      </span>
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={() => toggleFavorite(e._id)}
                      className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg hover:scale-110 transition-all"
                    >
                      <Heart
                        size={18}
                        className={
                          favorites.includes(e._id)
                            ? "fill-red-500 text-red-500"
                            : "text-gray-600"
                        }
                      />
                    </button>

                    {/* Gradient Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-xl text-[#2f4156] mb-2 line-clamp-2 min-h-[3.5rem]">
                      {e.title}
                    </h3>

                    <div className="space-y-2 mb-4">
                      {e.location && (
                        <div className="flex items-center gap-2 text-sm text-[#567c8d]">
                          <MapPin size={16} className="flex-shrink-0" />
                          <span className="truncate">{e.location}</span>
                        </div>
                      )}

                      {eventDate && (
                        <div className="flex items-center gap-2 text-sm text-[#567c8d]">
                          <Clock size={16} className="flex-shrink-0" />
                          <span>{eventDate}</span>
                        </div>
                      )}

                      {e.allowedRoles && e.allowedRoles.length > 0 && (
                        <div
                          style={{
                            padding: "6px 10px",
                            background: "#e3f2fd",
                            borderRadius: "4px",
                            fontSize: "12px",
                            color: "#1976d2",
                            fontWeight: "500",
                          }}
                        >
                          🔒 Restricted to: {e.allowedRoles.join(", ")}
                        </div>
                      )}
                    </div>

                    <button
                      className="mt-4 w-full bg-gradient-to-r from-[#567c8d] to-[#45687a] text-white py-2.5 rounded-lg font-medium hover:from-[#45687a] hover:to-[#567c8d] transform hover:-translate-y-0.5 transition-all duration-200 shadow-md hover:shadow-lg"
                      onClick={() => navigate(`/events/${e._id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
