// client/src/pages/StudentDashboard.js

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import conferencePlaceholder from "../images/Conferenceroommeetingconcept.jpeg";
import tripPlaceholder from "../images/Womanlookingatmapplanningtrip.jpeg";
import bazaarPlaceholder from "../images/Arabbazaarisolatedonwhitebackground_FreeVector.jpeg";
import workshopPlaceholder from "../images/download(12).jpeg";

import {
  Search,
  Menu,
  Bell,
  User,
  LogOut,
  Calendar,
  Map,
  Heart,
  CheckCircle,
} from "lucide-react";

import StudentSidebar from "../components/StudentSidebar";
import EventTypeDropdown from "../components/EventTypeDropdown";

const StudentDashboard = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /* ---------------------- Fetch Events ---------------------- */

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();

        const combinedSearch = [searchTerm, searchLocation]
          .filter(Boolean)
          .join(" ");

        if (combinedSearch) params.append("search", combinedSearch);
        if (eventTypeFilter !== "All") params.append("type", eventTypeFilter);
        if (dateFilter) params.append("date", dateFilter);

        params.append("sort", "startDateTime");
        params.append("order", sortOrder === "asc" ? "desc" : "asc");

        const res = await fetch(`/api/events/all?${params}`);
        const data = await res.json();
        setAllEvents(res.ok ? data : []);
      } catch (err) {
        console.error(err);
        setAllEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [searchTerm, searchLocation, eventTypeFilter, dateFilter, sortOrder]);

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
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-[#f5efeb] rounded-lg md:hidden"
          >
            <Menu size={24} className="text-[#2f4156]" />
          </button>

          {/* Search + Filters */}
          <div className="flex flex-col md:flex-row gap-2 flex-1 max-w-4xl mx-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#567c8d]"
                size={20}
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#c8d9e6] rounded-lg"
              />
            </div>

            <EventTypeDropdown
              selected={eventTypeFilter}
              onChange={setEventTypeFilter}
            />

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-[#c8d9e6] rounded-lg"
            />

            <button
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
              className="px-4 py-2 bg-[#567c8d] text-white rounded-lg whitespace-nowrap"
            >
              Sort {sortOrder === "asc" ? "Oldest" : "Newest"}
            </button>
          </div>

          {/* User + Notifications */}
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-[#f5efeb] rounded-lg">
              <Bell size={20} className="text-[#567c8d]" />
            </button>

            <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center">
              <User size={20} className="text-[#2f4156]" />
            </div>
          </div>
        </header>

        {/* ---- PAGE CONTENT ---- */}
        <main className="p-4 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-[#2f4156]">
              Available Events
            </h1>

            <button
              onClick={() => navigate("/favorites")}
              className="text-[#567c8d] hover:text-[#2f4156] flex items-center gap-1"
            >
              <Heart
                size={20}
                className={
                  favorites.length > 0 ? "fill-red-500 text-red-500" : ""
                }
              />
              Favorites ({favorites.length})
            </button>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {allEvents.map((e) => {
              const fallbackImage =
                {
                  TRIP: tripPlaceholder,
                  BAZAAR: bazaarPlaceholder,
                  CONFERENCE: conferencePlaceholder,
                  WORKSHOP: workshopPlaceholder,
                  BOOTH: workshopPlaceholder,
                }[e.type] || workshopPlaceholder;

              return (
                <div
                  key={e._id}
                  className="bg-white border border-[#c8d9e6] rounded-2xl shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="h-40 w-full bg-gray-200 relative">
                    <img
                      src={e.image || fallbackImage}
                      className="h-full w-full object-cover"
                    />

                    <button
                      onClick={() => toggleFavorite(e._id)}
                      className="absolute top-2 right-2 p-2 bg-white rounded-full shadow"
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
                      {e.title}
                    </h3>
                    <p className="text-sm text-[#567c8d] truncate">
                      Type: {e.type}
                    </p>

                    <button
                      className="mt-4 w-full bg-[#567c8d] text-white py-2 rounded-lg hover:bg-[#45687a]"
                      onClick={() => navigate(`/events/${e._id}`)}
                    >
                      Details
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
