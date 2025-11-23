import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Menu,
  Bell,
  User,
  LogOut,
  Calendar,
  Map,
  Heart,
  Star,
  MessageCircle,
} from "lucide-react";
import workshopPlaceholder from "../images/workshop.png";
import tripPlaceholder from "../images/trip.jpeg";
import bazaarPlaceholder from "../images/bazaar.jpeg";
import conferencePlaceholder from "../images/conference.jpg";
import EventTypeDropdown from "../components/EventTypeDropdown";

const API_BASE = "http://localhost:3000"; // ← Your working backend

const TaDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("");
  const [professorFilter, setProfessorFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [serverLoading, setServerLoading] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [debouncedProfessor, setDebouncedProfessor] = useState(professorFilter);

  // Reviews state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedProfessor(professorFilter), 300);
    return () => clearTimeout(t);
  }, [professorFilter]);

  // Get user ID
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

  // Fetch favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch("/api/users/me/favorites", { headers });
        if (res.ok) {
          const data = await res.json();
          setFavorites(data.map((e) => e._id));
        }
      } catch (err) {
        console.error("Failed to fetch favorites", err);
      }
    };
    fetchFavorites();
  }, []);

  // Fetch all events
  useEffect(() => {
    const fetchEvents = async () => {
      setServerLoading(true);
      try {
        const params = new URLSearchParams();
        const searchValue = [debouncedSearch, debouncedProfessor].filter(Boolean).join(" ");
        if (searchValue) params.append("search", searchValue);
        if (locationFilter) params.append("location", locationFilter);
        if (eventTypeFilter && eventTypeFilter !== "All") params.append("type", eventTypeFilter);
        params.append("sort", "startDateTime");
        params.append("order", sortOrder === "asc" ? "desc" : "asc");

        const res = await fetch(`/api/events/all?${params}`);
        if (res.ok) {
          const data = await res.json();
          setAllEvents(data);
        } else {
          setAllEvents([]);
        }
      } catch (err) {
        console.error("Failed to fetch events", err);
        setAllEvents([]);
      } finally {
        setServerLoading(false);
      }
    };
    fetchEvents();
  }, [debouncedSearch, eventTypeFilter, locationFilter, debouncedProfessor, sortOrder]);

  // Fetch reviews when event is selected
  const loadReviews = async (eventId) => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/events/${eventId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data || []);
        const myReview = data.find(r => r.userId?.toString() === userId);
        if (myReview) {
          setMyRating(myReview.rating);
          setMyComment(myReview.comment || "");
        }
      }
    } catch (err) {
      console.error("Failed to load reviews", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const submitReview = async () => {
    if (!selectedEvent || myRating === 0) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/events/${selectedEvent._id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: myRating, comment: myComment.trim() || null }),
      });

      if (res.ok) {
        const updated = await res.json();
        setReviews(updated);
        alert("Review submitted successfully!");
        setMyRating(0);
        setMyComment("");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to submit");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const toggleFavorite = async (eventId) => {
    // ... your existing toggleFavorite code
  };

  const handleDetails = (event) => {
    setSelectedEvent(event);
    loadReviews(event._id);
  };

  const closeReviews = () => setSelectedEvent(null);

  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const hasPassed = selectedEvent && new Date(selectedEvent.endDateTime || selectedEvent.startDateTime) < new Date();
  const alreadyReviewed = reviews.some(r => r.userId?.toString() === userId);
  const isBazaarOrBooth = selectedEvent && (selectedEvent.type === "BAZAAR" || selectedEvent.type === "BOOTH");
  const canReview = userId && hasPassed && !alreadyReviewed && isBazaarOrBooth;

  if (serverLoading) {
    return (
      <div className="flex h-screen bg-[#f5efeb] items-center justify-center">
        <p className="text-[#567c8d]">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f5efeb]">
      {/* Sidebar & Header — unchanged */}
      {/* ... your existing sidebar and header ... */}

      <div className="flex-1 overflow-auto">
        {/* Header — unchanged */}
        {/* ... your header ... */}

        <main className="p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#2f4156] mb-6">
            Available Events
          </h1>

          {/* Event Grid — unchanged */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
             {allEvents
    .filter(e => e.status !== "archived") // hide archived events
    .map((e) => (
              <div key={e._id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* ... your existing card ... */}
                <button
                  onClick={() => handleDetails(e)}
                  className="w-full bg-[#567c8d] hover:bg-[#45687a] text-white py-3 font-medium"
                >
                  View Details & Review
                </button>
              </div>
            ))}
          </div>
        </main>

        {/* REVIEWS MODAL — Appears when event is selected */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-screen overflow-y-auto p-8 relative">
              <button
                onClick={closeReviews}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                × Close
              </button>

              <h2 className="text-2xl font-bold text-[#2f4156] mb-4">
                {selectedEvent.title || selectedEvent.name}
              </h2>

              {hasPassed ? (
                <div className="mt-8">
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                    <MessageCircle /> Ratings & Reviews
                  </h3>

                  {reviews.length > 0 && (
                    <div className="bg-[#f5efeb] p-6 rounded-xl mb-6 text-center">
                      <div className="text-5xl font-bold text-[#567c8d]">{avgRating}</div>
                      <div className="flex justify-center gap-1 my-2">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} size={32} className={n <= avgRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                        ))}
                      </div>
                      <p>Based on {reviews.length} reviews</p>
                    </div>
                  )}

                  {canReview && (
                    <div className="bg-[#f8f9fa] p-6 rounded-xl mb-8 border">
                      <h4 className="font-semibold mb-4">Leave Your Review</h4>
                      <div className="flex gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} onClick={() => setMyRating(n)}>
                            <Star size={40} className={n <= myRating ? "fill-yellow-500 text-yellow-500" : "text-gray-400 hover:text-yellow-500"} />
                          </button>
                        ))}
                      </div>
                      <textarea
                        placeholder="Share your experience..."
                        value={myComment}
                        onChange={(e) => setMyComment(e.target.value)}
                        className="w-full p-4 border rounded-lg resize-none"
                        rows={4}
                      />
                      <button
                        onClick={submitReview}
                        className="mt-4 px-8 py-3 bg-[#567c8d] hover:bg-[#45687a] text-white rounded-lg"
                      >
                        Submit Review
                      </button>
                    </div>
                  )}

                  <div className="space-y-4">
                    {reviews.map((r) => (
                      <div key={r._id || r.createdAt} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">{r.userName}</div>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(n => (
                              <Star key={n} size={18} className={n <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                            ))}
                          </div>
                        </div>
                        {r.comment && <p className="mt-2 text-gray-700">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">Event has not ended yet. Reviews available after it ends.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaDashboard;