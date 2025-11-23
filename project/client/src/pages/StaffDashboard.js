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

const API_BASE = "http://localhost:3000"; // Your working backend

const StaffDashboard = () => {
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

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedProfessor, setDebouncedProfessor] = useState("");

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

  // Fetch favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/users/me/favorites", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
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

  // Load reviews for selected event
  const loadReviews = async (eventId) => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/events/${eventId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data || []);
        const myReview = data.find((r) => r.userId?.toString() === userId);
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
    if (!selectedEvent || myRating === 0) {
      alert("Please select a rating");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/events/${selectedEvent._id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: myRating,
          comment: myComment.trim() || null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setReviews(updated);
        alert("Thank you for your review!");
        setMyRating(0);
        setMyComment("");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to submit review");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const toggleFavorite = async (eventId) => {
    const method = favorites.includes(eventId) ? "DELETE" : "POST";
    const url = `/api/users/me/favorites${method === "DELETE" ? `/${eventId}` : ""}`;
    try {
      const token = localStorage.getItem("token");
      await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
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

  const handleDetails = (event) => {
    setSelectedEvent(event);
    loadReviews(event._id);
  };

  const closeModal = () => setSelectedEvent(null);

 const filteredEvents = allEvents
  .filter((e) => e.status !== "archived") // ← hide archived events
  .filter((e) => {
    const name = (e.title || e.name || e.workshopName || "").toLowerCase();
    const profs = (e.professorsParticipating || "").toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || profs.includes(searchTerm.toLowerCase());
    const matchesProfessor = !professorFilter || profs.includes(professorFilter.toLowerCase());
    const matchesLocation = !locationFilter || (e.location || "").toLowerCase().includes(locationFilter.toLowerCase());
    const matchesType = eventTypeFilter === "All" || e.type === eventTypeFilter;
    return matchesSearch && matchesType && matchesProfessor && matchesLocation;
  });


  const formatEventDate = (date) => (!date ? "N/A" : new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }));

  // Review logic
  const hasPassed = selectedEvent && new Date(selectedEvent.endDateTime || selectedEvent.startDateTime || selectedEvent.startDate) < new Date();
  const alreadyReviewed = reviews.some((r) => r.userId?.toString() === userId);
  const isBazaarOrBooth = selectedEvent && (selectedEvent.type === "BAZAAR" || selectedEvent.type === "BOOTH");
  const canReview = userId && hasPassed && !alreadyReviewed && isBazaarOrBooth;

  const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : 0;

  if (serverLoading) {
    return (
      <div className="flex h-screen bg-[#f5efeb] items-center justify-center">
        <p className="text-[#567c8d]">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f5efeb]">
      {/* Sidebar & Header — unchanged (your existing code) */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsSidebarOpen(false)}></div>}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#2f4156] text-white flex flex-col transform transition-transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Your existing sidebar */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#567c8d] rounded-full"></div>
            <span className="text-xl font-bold">EventHub</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-[#567c8d] rounded-lg"><Menu size={20} /></button>
        </div>
        <div className="flex-1 px-4 mt-4 space-y-2">
          <button onClick={() => { navigate("/events/registered"); setIsSidebarOpen(false); }} className="w-full flex items-center gap-3 bg-[#567c8d] hover:bg-[#45687a] text-white py-3 px-4 rounded-lg"><Calendar size={18} /> Registered Events</button>
          <button onClick={() => { navigate("/favorites"); setIsSidebarOpen(false); }} className="w-full flex items-center gap-3 bg-[#567c8d] hover:bg-[#45687a] text-white py-3 px-4 rounded-lg"><Heart size={18} /> Favorites</button>
          <button onClick={() => { navigate("/courts-availability"); setIsSidebarOpen(false); }} className="w-full flex items-center gap-3 bg-[#567c8d] hover:bg-[#45687a] text-white py-3 px-4 rounded-lg"><Map size={18} /> Courts Availability</button>
          <button onClick={() => { navigate("/gym-sessions-register"); setIsSidebarOpen(false); }} className="w-full flex items-center gap-3 bg-[#567c8d] hover:bg-[#45687a] text-white py-3 px-4 rounded-lg"><Calendar size={18} /> Gym Sessions</button>
          <button onClick={() => window.confirm("Logout?") && navigate("/")} className="w-full flex items-center justify-center gap-2 bg-[#c88585] hover:bg-[#b87575] text-white py-3 px-4 rounded-lg"><LogOut size={18} /> Logout</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4 flex items-center justify-between">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-[#f5efeb] rounded-lg"><Menu size={24} className="text-[#2f4156]" /></button>
          <div className="flex-1 max-w-2xl flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#567c8d]" size={20} />
              <input type="text" placeholder="Search events or professors" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-[#c8d9e6] rounded-lg focus:ring-2 focus:ring-[#567c8d]" />
            </div>
            <EventTypeDropdown selected={eventTypeFilter} onChange={setEventTypeFilter} />
            <input type="text" placeholder="Professor" value={professorFilter} onChange={(e) => setProfessorFilter(e.target.value)} className="hidden md:block px-3 py-2 border rounded-lg" />
            <input type="text" placeholder="Location" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="hidden md:block px-3 py-2 border rounded-lg" />
            <button onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")} className="px-4 py-2 bg-[#567c8d] text-white rounded-lg hover:bg-[#45687a]">Sort {sortOrder === "asc" ? "Newest" : "Oldest"}</button>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-[#f5efeb] rounded-lg"><Bell size={20} className="text-[#567c8d]" /></button>
            <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center"><User size={20} className="text-[#2f4156]" /></div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <h1 className="text-3xl font-bold text-[#2f4156] mb-6">Available Events</h1>
          {filteredEvents.length === 0 ? (
            <p className="text-[#567c8d]">No upcoming events found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredEvents.map((e) => (
                <div key={e._id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 relative">
                    <img src={e.image || (e.type === "TRIP" ? tripPlaceholder : e.type === "BAZAAR" ? bazaarPlaceholder : e.type === "CONFERENCE" ? conferencePlaceholder : workshopPlaceholder)} alt={e.title || "Event"} className="w-full h-full object-cover" />
                    <button onClick={(ev) => { ev.stopPropagation(); toggleFavorite(e._id); }} className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md">
                      <Heart size={18} className={favorites.includes(e._id) ? "fill-red-500 text-red-500" : "text-gray-600"} />
                    </button>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-[#2f4156]">{e.title || e.name || "Untitled Event"}</h3>
                    <p className="text-sm text-[#567c8d] mt-1">Type: {e.type || "N/A"}</p>
                    <p className="text-sm text-[#567c8d]">Date: {formatEventDate(e.startDateTime || e.startDate)}</p>
                    <button onClick={() => handleDetails(e)} className="mt-4 w-full bg-[#567c8d] hover:bg-[#45687a] text-white py-3 rounded-lg font-medium transition-colors">
                      View Details & Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* REVIEW MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-screen overflow-y-auto p-8 relative">
            <button onClick={closeModal} className="absolute top-4 right-6 text-3xl text-gray-500 hover:text-gray-800">&times;</button>
            <h2 className="text-3xl font-bold text-[#2f4156] mb-6">{selectedEvent.title || selectedEvent.name}</h2>

            {hasPassed ? (
              <>
                <div className="flex items-center gap-3 mb-8">
                  <MessageCircle size={32} className="text-[#567c8d]" />
                  <h3 className="text-2xl font-bold">Ratings & Reviews ({reviews.length})</h3>
                </div>

                {reviews.length > 0 && (
                  <div className="bg-[#f5efeb] p-6 rounded-xl text-center mb-8">
                    <div className="text-6xl font-bold text-[#567c8d]">{avgRating}</div>
                    <div className="flex justify-center gap-2 my-3">
                      {[1, 2, 3, 4, 5].map(n => <Star key={n} size={40} className={n <= avgRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />)}
                    </div>
                    <p className="text-gray-600">Based on {reviews.length} reviews</p>
                  </div>
                )}

                {canReview && (
                  <div className="bg-[#f8f9fa] border-2 border-dashed border-[#c8d9e6] rounded-xl p-8 mb-8">
                    <h4 className="text-xl font-bold mb-6">Leave Your Review</h4>
                    <div className="flex gap-3 justify-center mb-6">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setMyRating(n)}>
                          <Star size={48} className={n <= myRating ? "fill-yellow-500 text-yellow-500" : "text-gray-400 hover:text-yellow-500 transition"} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      placeholder="Share your experience with this bazaar/booth..."
                      value={myComment}
                      onChange={(e) => setMyComment(e.target.value)}
                      className="w-full p-4 border border-[#c8d9e6] rounded-lg focus:ring-2 focus:ring-[#567c8d] resize-none"
                      rows={5}
                    />
                    <button onClick={submitReview} className="mt-6 w-full bg-[#567c8d] hover:bg-[#45687a] text-white py-4 rounded-lg text-lg font-semibold transition">
                      Submit Review
                    </button>
                  </div>
                )}

                <div className="space-y-6">
                  {reviews.map((r, i) => (
                    <div key={i} className="bg-gray-50 p-6 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#567c8d] rounded-full flex items-center justify-center text-white font-bold text-xl">
                            {r.userName?.[0] || "S"}
                          </div>
                          <div>
                            <p className="font-bold text-[#2f4156]">{r.userName || "Staff"}</p>
                            <p className="text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(n => <Star key={n} size={20} className={n <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />)}
                        </div>
                      </div>
                      {r.comment && <p className="text-gray-700 leading-relaxed">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-gray-600 py-12 text-lg">This event has not ended yet. Reviews will be available after it concludes.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;