// client/src/pages/FavoritesList.js

import React, { useState, useEffect ,useRef, useCallback } from "react";

import { useNavigate } from "react-router-dom";

import StudentSidebar from "../components/StudentSidebar";
import ProfessorSidebar from "../components/ProfessorSidebar";
import TaSidebar from "../components/TaSidebar";
import StaffSidebar from "../components/StaffSidebar";

import {
  Heart,
  Calendar,
  MapPin,
  Clock,
  Bell,
  User,
  Mic,
  MicOff,
} from "lucide-react";
import workshopPlaceholder from "../images/workshop.png";
import boothPlaceholder from "../images/booth.jpg";
import conferenceImg from "../images/Conferenceroommeetingconcept.jpeg";
import tripImg from "../images/Womanlookingatmapplanningtrip.jpeg";
import bazaarImg from "../images/Arabbazaarisolatedonwhitebackground_FreeVector.jpeg";
import workshopImg from "../images/download(12).jpeg";
const API_BASE = "http://localhost:3000";

const FavoritesList = () => {
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState([]);

  const [loading, setLoading] = useState(true);

  const [userRole, setUserRole] = useState(null);
  // 🔔 notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
// 🎙 Voice state
  const [isListening, setIsListening] = useState(false);
  const [assistantActive, setAssistantActive] = useState(false);
  const assistantActiveRef = useRef(false);
  const recognitionRef = useRef(null);
  const lastConfirmationRef = useRef("");
  const [voiceStatus, setVoiceStatus] = useState("");
  const [lastTranscript, setLastTranscript] = useState("");
const [userId, setUserId] = useState(null);
   useEffect(() => {
    assistantActiveRef.current = assistantActive;
  }, [assistantActive]);

  // 🔊 Speak helper (same pattern as dashboard)
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

  // 🔑 decode token for role + id
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserRole((payload.role || "student").toLowerCase());
        setUserId(payload.id || payload.userId || payload._id);
      } catch (err) {
        console.error("Failed to decode token", err);
      }
    }
  }, []);

  // 🔔 fetch notifications when we know userId
  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/notifications/user/${userId}`
        );
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


  // 🧠 Voice commands JUST for Favorites (no filtering)
  const handleFavoritesVoiceCommand = useCallback(
    (text) => {
      const cmd = text.toLowerCase().trim();

      // Go back
      if (cmd === "go back" || cmd === "back" || cmd.includes("previous")) {
        navigate(-1);
        return "Going back.";
      }

      // Go to dashboard
      if (cmd.includes("dashboard") || cmd.includes("home")) {
        navigate("/student/dashboard");
        return "Opening your student dashboard.";
      }

      // Already here
      if (cmd.includes("favorite")) {
        return "You are already on your favorites page.";
      }

      // View details of a favorite
      if (
        cmd.includes("view details") ||
        cmd.includes("open event") ||
        cmd.includes("show details")
      ) {
        if (!favorites || favorites.length === 0) {
          return "There are no favorite events to show details for.";
        }

        const first = favorites[0];
        navigate(`/events/${first._id}`, { state: { fromAdmin: false } });

        const title =
          first.title ||
          first.name ||
          first.workshopName ||
          "your first favorite event";

        return `Opening details for ${title}.`;
      }

      // Fallback
      return "On the favorites page, you can say go back, go to dashboard, or view details.";
    },
    [navigate, favorites]
  );

  // 🎛 Toggle voice assistant (mic button / 'v' key)
  const startVoiceAssistant = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    // If already active -> turn off
    if (assistantActiveRef.current) {
      assistantActiveRef.current = false;
      setAssistantActive(false);
      setVoiceStatus("Stopped listening.");
      window.speechSynthesis.cancel();
      recognition.stop();
      return;
    }

    // Turn ON
    assistantActiveRef.current = true;
    setAssistantActive(true);
    setVoiceStatus("Starting voice assistant...");
    window.speechSynthesis.cancel();

    speak(
      "You are on your favorites page. You can say, go back, go to dashboard, or view details. How can I help you?",
      () => {
        try {
          recognition.start();
        } catch (e) {
          console.error("Recognition start error:", e);
          setVoiceStatus("Could not start listening.");
          assistantActiveRef.current = false;
          setAssistantActive(false);
        }
      }
    );
  }, [speak]);

  // 🎤 SpeechRecognition setup
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
    recognition.continuous = false; // we manually restart while active

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceStatus("Listening for your command...");
    };

    recognition.onend = () => {
      setIsListening(false);

      if (!assistantActiveRef.current) return;

      if (lastConfirmationRef.current) {
        const msg = lastConfirmationRef.current;
        lastConfirmationRef.current = "";
        setVoiceStatus(msg);
        speak(msg, () => {
          if (assistantActiveRef.current) {
            try {
              recognition.start();
            } catch (e) {
              console.error("Recognition restart error:", e);
            }
          }
        });
      } else {
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
      const transcript = raw.toLowerCase().replace(/[.!?]+$/g, "").trim();
      console.log("Favorites heard:", transcript);
      setLastTranscript(transcript);

      const confirmation = handleFavoritesVoiceCommand(transcript);
      lastConfirmationRef.current = confirmation || "";
    };

    recognitionRef.current = recognition;

    return () => {
      assistantActiveRef.current = false;
      setAssistantActive(false);
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      try {
        recognition.stop();
      } catch (e) {
        console.error("Recognition stop error:", e);
      }
    };
  }, [handleFavoritesVoiceCommand, speak]);

  // ⌨️ "v" keyboard shortcut (same as dashboard)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === "v") {
        startVoiceAssistant();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [startVoiceAssistant]);

  // ================== EXISTING FAVORITES LOGIC ==================
  useEffect(() => {
    // Get user role from token
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserRole((payload.role || "student").toLowerCase());
      } catch (err) {
        console.error("Failed to decode token", err);
      }
    }

    const fetchFavorites = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch("/api/users/me/favorites", { headers });

        if (res.ok) {
          const data = await res.json();

          setFavorites(data);
        } else {
          setFavorites([]);
        }
      } catch (err) {
        console.error("Failed to load favorites", err);

        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const removeFavorite = async (eventId) => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await fetch(`/api/users/me/favorites/${eventId}`, {
        method: "DELETE",
        headers,
      });

      setFavorites((prev) => prev.filter((f) => f._id !== eventId));
    } catch (err) {
      console.error("Remove failed", err);
    }
  };

  const handleDetails = (event) => {
    navigate(`/events/${event._id}`, { state: { fromAdmin: false } });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";

    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",

      day: "numeric",

      year: "numeric",
    });
  };

  const getImage = (type) => {
    const map = {
      TRIP: tripImg,
      BAZAAR: bazaarImg,
      CONFERENCE: conferenceImg,
      WORKSHOP: workshopImg,
      BOOTH: boothPlaceholder,
    };

    return map[type] || workshopPlaceholder;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5efeb] flex items-center justify-center">
        <p className="text-[#567c8d]">Loading favorites...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {!userRole ? null : userRole === "professor" ? (
        <ProfessorSidebar />
      ) : userRole === "staff" ? (
        <StaffSidebar />
      ) : userRole === "ta" ? (
        <TaSidebar />
      ) : (
        <StudentSidebar />
      )}
      {/* Right side (header + content) */}
      <div
        className="flex-1 flex flex-col bg-[#f5efeb]"
        style={{ marginLeft: "260px" }}
      >
        {/* 🧭 unified header like StudentDashboard */}
        <header className="bg-white border-b border-[#c8d9e6] px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-[#2f4156]">
              My Favorites
            </h1>
            <div className="flex items-center gap-2 text-[#567c8d]">
              <Heart size={20} className="fill-red-500 text-red-500" />
              <span>{favorites.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Voice button */}
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

            {/* Notifications bell */}
            <button
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative p-2 hover:bg-[#f5efeb] rounded-lg"
            >
              <Bell size={20} className="text-[#567c8d]" />
              {notifications.some((n) => n.unread) && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* Avatar */}
            <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center">
              <User size={20} className="text-[#2f4156]" />
            </div>
          </div>
        </header>

        {/* Notifications dropdown (same style as dashboard) */}
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

         {/* Voice status bars */}
        {voiceStatus && (
          <div className="px-4 py-2 bg-[#fff8e1] text-[#5d4037] text-sm">
            🎙️ Eventity: {voiceStatus}
          </div>
        )}
        {lastTranscript && (
          <div className="px-4 py-2 bg-[#e3f2fd] text-[#0d47a1] text-xs">
            👂 Last heard: "{lastTranscript}"
          </div>
        )}

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Empty State */}
            {favorites.length === 0 ? (
              <div className="text-center py-16">
                <Heart size={64} className="mx-auto text-[#c8d9e6] mb-4" />
                <p className="text-[#567c8d] text-lg">
                  No favorite events yet.
                </p>

                <button
                  onClick={() => {
                    const token = localStorage.getItem("token");
                    let path = "/events";
                    if (token) {
                      try {
                        const payload = JSON.parse(atob(token.split(".")[1]));
                        const role = payload.role;
                        if (role === "student") path = "/student/dashboard";
                        else if (role === "staff") path = "/staff/dashboard";
                        else if (role === "ta") path = "/ta/dashboard";
                        else if (role === "professor")
                          path = "/professor/dashboard";
                      } catch (e) {
                        /* invalid token */
                      }
                    }
                    navigate(path);
                  }}
                  className="mt-4 px-6 py-2 bg-[#567c8d] hover:bg-[#45687a] text-white rounded-lg transition-colors"
                >
                  Browse Events
                </button>
              </div>
            ) : (
              /* Favorites Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {favorites.map((event) => {
                  const eventDate = event.startDateTime
                    ? new Date(event.startDateTime).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        }
                      )
                    : "";

                  return (
                    <div
                      key={event._id}
                      className="bg-white border border-[#c8d9e6] rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
                    >
                    <div className="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                      <img
                        src={event.image || getImage(event.type)}
                        alt={event.title}
                        className="h-full w-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => (e.target.src = getImage(event.type))}
                      />

                      {/* Event Type Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/90 backdrop-blur-sm text-[#2f4156] px-3 py-1.5 rounded-full text-xs font-semibold shadow-md">
                          {event.type}
                        </span>
                      </div>

                      {/* Remove Favorite Button */}
                      <button
                        onClick={() => removeFavorite(event._id)}
                        className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg hover:scale-110 transition-all"
                      >
                        <Heart
                          size={18}
                          className="fill-red-500 text-red-500"
                        />
                      </button>

                      {/* Gradient Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>

                    <div className="p-5">
                      <h3 className="font-bold text-xl text-[#2f4156] mb-2 line-clamp-2 min-h-[3.5rem]">
                        {event.title ||
                          event.name ||
                          event.workshopName ||
                          "Untitled Event"}
                      </h3>

                      <div className="space-y-2 mb-4">
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-[#567c8d]">
                            <MapPin size={16} className="flex-shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}

                        {eventDate && (
                          <div className="flex items-center gap-2 text-sm text-[#567c8d]">
                            <Clock size={16} className="flex-shrink-0" />
                            <span>{eventDate}</span>
                          </div>
                        )}

                        {event.professorsParticipating && (
                          <div className="flex items-center gap-2 text-sm text-[#567c8d]">
                            <Calendar size={16} className="flex-shrink-0" />
                            <span className="truncate">
                              Prof: {event.professorsParticipating}
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDetails(event)}
                        className="mt-4 w-full bg-gradient-to-r from-[#567c8d] to-[#45687a] text-white py-2.5 rounded-lg font-medium hover:from-[#45687a] hover:to-[#567c8d] transform hover:-translate-y-0.5 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
                </main>

      </div>
      
     </div>
    
  );
};

export default FavoritesList;
