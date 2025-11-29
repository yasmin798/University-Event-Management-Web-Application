// client/src/pages/FavoritesList.js

import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import StudentSidebar from "../components/StudentSidebar";
import ProfessorSidebar from "../components/ProfessorSidebar";
import TaSidebar from "../components/TaSidebar";
import StaffSidebar from "../components/StaffSidebar";

import { Heart, Calendar, MapPin, Clock } from "lucide-react";

import workshopPlaceholder from "../images/workshop.png";
import boothPlaceholder from "../images/booth.jpg";
import conferenceImg from "../images/Conferenceroommeetingconcept.jpeg";
import tripImg from "../images/Womanlookingatmapplanningtrip.jpeg";
import bazaarImg from "../images/Arabbazaarisolatedonwhitebackground_FreeVector.jpeg";
import workshopImg from "../images/download(12).jpeg";

const FavoritesList = () => {
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState([]);

  const [loading, setLoading] = useState(true);

  const [userRole, setUserRole] = useState(null);

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
      <div
        className="flex-1 bg-[#f5efeb] p-4 md:p-8"
        style={{ marginLeft: "260px" }}
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}

          <div className="flex items-center gap-4 mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-[#2f4156]">
              My Favorites
            </h1>

            <div className="ml-auto flex items-center gap-2 text-[#567c8d]">
              <Heart size={20} className="fill-red-500 text-red-500" />

              <span>{favorites.length}</span>
            </div>
          </div>

          {/* Empty State */}

          {favorites.length === 0 ? (
            <div className="text-center py-16">
              <Heart size={64} className="mx-auto text-[#c8d9e6] mb-4" />

              <p className="text-[#567c8d] text-lg">No favorite events yet.</p>

              <button
                onClick={() => {
                  // Navigate to the appropriate dashboard based on user role
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
                      /* invalid token - fallback to events */
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
                  ? new Date(event.startDateTime).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
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
      </div>
    </div>
  );
};

export default FavoritesList;
