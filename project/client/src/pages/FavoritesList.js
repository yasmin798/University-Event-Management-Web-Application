// client/src/pages/FavoritesList.js

import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import { Heart, Calendar, MapPin, Clock, ArrowLeft } from "lucide-react";

import tripPlaceholder from "../images/trip.jpeg";

import bazaarPlaceholder from "../images/bazaar.jpeg";

import conferencePlaceholder from "../images/conference.jpg";

import workshopPlaceholder from "../images/workshop.png";

const FavoritesList = () => {
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const token = localStorage.getItem("token");
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
      TRIP: tripPlaceholder,

      BAZAAR: bazaarPlaceholder,

      CONFERENCE: conferencePlaceholder,

      WORKSHOP: workshopPlaceholder,

      BOOTH: workshopPlaceholder,
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
    <div className="min-h-screen bg-[#f5efeb] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}

        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-lg shadow-sm transition-colors"
          >
            <ArrowLeft size={24} className="text-[#2f4156]" />
          </button>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((event) => (
              <div
                key={event._id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="h-48 relative">
                  <img
                    src={event.image || getImage(event.type)}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.target.src = getImage(event.type))}
                  />

                  <button
                    onClick={() => removeFavorite(event._id)}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                  >
                    <Heart size={18} className="fill-red-500 text-red-500" />
                  </button>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-lg text-[#2f4156] line-clamp-1">
                    {event.title}
                  </h3>

                  {event.professorsParticipating && (
                    <p className="text-sm text-[#567c8d] mt-1">
                      Prof: {event.professorsParticipating}
                    </p>
                  )}

                  <div className="flex items-center gap-1 text-sm text-[#567c8d] mt-2">
                    <Calendar size={14} />

                    <span>{formatDate(event.startDateTime)}</span>
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-1 text-sm text-[#567c8d] mt-1">
                      <MapPin size={14} />

                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleDetails(event)}
                      className="flex-1 bg-[#567c8d] hover:bg-[#45687a] text-white py-2 px-3 rounded-lg text-sm transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesList;
