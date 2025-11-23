import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Menu, Bell, User, LogOut, Star, MessageCircle } from "lucide-react";
import { useServerEvents } from "../hooks/useServerEvents";
import { workshopAPI } from "../api/workshopApi";
import { boothAPI } from "../api/boothApi";

import workshopPlaceholder from "../images/workshop.png";
import tripImage from "../images/trip.jpeg";
import bazaarImage from "../images/bazaar.jpeg";
import conferenceImage from "../images/conference.jpg";
import boothImage from "../images/booth.jpg";

const API_BASE = "http://localhost:3000";

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromAdmin = location.state?.fromAdmin || false;

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [booths, setBooths] = useState([]);
  const [boothsLoading, setBoothsLoading] = useState(true);
  const [workshops, setWorkshops] = useState([]);
  const [workshopsLoading, setWorkshopsLoading] = useState(true);

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [canReview, setCanReview] = useState(false);

  const { events: otherEvents } = useServerEvents({ refreshMs: 0 });

  // Get user ID from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserId(payload.id || payload.userId || payload._id);
        console.log("User ID from token:", payload.id || payload.userId || payload._id);
      } catch (e) {
        console.error("Invalid token");
      }
    } else {
      console.log("No token found — user not logged in");
    }
  }, []);

  // Fetch Reviews
  useEffect(() => {
    const fetchReviews = async () => {
      console.log("Fetching reviews for ID:", id);
      try {
        const res = await fetch(`${API_BASE}/api/events/${id}/reviews`);
        console.log("Reviews response status:", res.status);
        if (res.ok) {
          const data = await res.json();
          setReviews(data || []);
          const myReview = data.find(r => r.userId?.toString() === userId);
          if (myReview) {
            setMyRating(myReview.rating);
            setMyComment(myReview.comment || "");
          }
        } else {
          console.error("Reviews fetch failed:", res.status, await res.text());
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setReviewsLoading(false);
      }
    };

    if (id) fetchReviews();
  }, [id, userId]);

  // Updated review permission logic
  useEffect(() => {
    if (!event || !userId) return;

    const eventType = event.type?.toUpperCase(); // TRIP, WORKSHOP, BOOTH, BAZAAR, CONFERENCE
    const alreadyReviewed = reviews.some(r => r.userId?.toString() === userId);

    // CASE A: BOOTH / BAZAAR / CONFERENCE → anyone can review
    if (["BOOTH", "BAZAAR", "CONFERENCE"].includes(eventType)) {
      setCanReview(!alreadyReviewed); // Only block if already reviewed
      return;
    }

    // CASE B: TRIPS / WORKSHOPS → must be registered AND event ended
    const hasPassed = new Date(event.endDateTime || event.startDateTime || event.startDate) < new Date();

    if (!hasPassed || alreadyReviewed) {
      setCanReview(false);
      return;
    }

    let isRegistered = false;
    if (event.registeredUsers)
      isRegistered = event.registeredUsers.some(u => u.toString() === userId);
    if (event.registrations)
      isRegistered = isRegistered || event.registrations.some(r => r.userId?.toString() === userId);

    setCanReview(isRegistered);
  }, [event, reviews, userId]);

  // Submit Review
  const submitReview = async () => {
    if (myRating === 0) {
      alert("Please select a star rating");
      return;
    }

    console.log("Submitting review:", { myRating, myComment, userId, eventId: id });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/events/${id}/reviews`, {
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

      console.log("Submit response status:", res.status);

      if (res.ok) {
        const updated = await res.json();
        setReviews(updated);
        setMyRating(0);
        setMyComment("");
        alert("Thank you for your review!");
      } else {
        const errText = await res.text();
        console.error("Submit failed:", res.status, errText);
        alert(`Failed: ${res.status} - ${errText || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Network error:", err);
      alert("Network error. Check console for details.");
    }
  };

  // Booths fetch
  useEffect(() => {
    const fetchBooths = async () => {
      setBoothsLoading(true);
      try {
        const data = await boothAPI.getAllBooths();
        const normalizedBooths = data.map(b => ({
          _id: b._id,
          type: "BOOTH",
          bazaarId: b.bazaar?._id,
          title: `${b.bazaar?.title} Booth`,
          attendees: b.attendees?.map(a => a.name || "Unknown") || [],
          boothSize: b.boothSize,
          durationWeeks: b.durationWeeks,
          platformSlot: b.platformSlot,
          status: b.status,
          description: b.description || "",
          image: b.image || boothImage,
        }));
        setBooths(normalizedBooths);
      } catch (err) {
        console.error("Error fetching booths:", err);
        setBooths([]);
      } finally {
        setBoothsLoading(false);
      }
    };
    fetchBooths();
  }, []);

  // Workshops fetch
  useEffect(() => {
    const fetchWorkshops = async () => {
      setWorkshopsLoading(true);
      try {
        const data = await workshopAPI.getAllWorkshops();
        const normalizedWorkshops = data.map((w) => {
          const start = w.startDateTime ? new Date(w.startDateTime) : new Date();
          const end = w.endDateTime ? new Date(w.endDateTime) : start;
          return {
            ...w,
            _id: w._id,
            type: "WORKSHOP",
            title: w.workshopName,
            name: w.workshopName,
            startDateTime: start.toISOString(),
            endDateTime: end.toISOString(),
            startDate: start.toISOString(),
            date: start.toISOString(),
            image: w.image || workshopPlaceholder,
            description: w.shortDescription,
            professorsParticipating: w.professorsParticipating || "",
          };
        });
        setWorkshops(normalizedWorkshops);
      } catch (error) {
        console.error("Error fetching workshops:", error);
        setWorkshops([]);
      } finally {
        setWorkshopsLoading(false);
      }
    };
    fetchWorkshops();
  }, []);

  // Combine events
  useEffect(() => {
    if (loading || boothsLoading || workshopsLoading) return;

    const allEvents = [
      ...otherEvents.filter(e => !e.status || e.status === "published"),
      ...workshops,
      ...booths,
    ];

    const foundEvent = allEvents.find(e => e._id === id);

    if (foundEvent) {
      if (foundEvent.type === "BAZAAR") {
        const eventBooths = booths.filter(b => b.bazaarId === id && b.status === "accepted");
        foundEvent.booths = eventBooths;
      } else if (foundEvent.type === "BOOTH") {
        foundEvent.booths = [foundEvent];
      }
      setEvent(foundEvent);
      setError("");
    } else {
      setEvent(null);
      setError("Event not found");
    }
  }, [id, otherEvents, workshops, booths, loading, boothsLoading, workshopsLoading]);

  useEffect(() => {
    const stillLoading = workshopsLoading || (otherEvents.length === 0 && workshops.length === 0);
    setLoading(stillLoading);
  }, [otherEvents, workshopsLoading, workshops.length]);

  const formatDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatMoney = (n) => {
    if (n == null || n === "") return "—";
    const num = Number(n);
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(num);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#f5efeb] items-center justify-center">
        <p className="text-[#567c8d] mb-4">Loading event details...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#567c8d] mx-auto"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex h-screen bg-[#f5efeb] items-center justify-center">
        <h2 className="text-xl font-semibold text-[#2f4156] mb-4">Event Not Found</h2>
        <button onClick={() => navigate(-1)} className="bg-[#567c8d] hover:bg-[#45687a] text-white px-6 py-2 rounded-lg">
          ← Back to Events
        </button>
      </div>
    );
  }

  const type = event.type?.toUpperCase() || "EVENT";
  const title = event.title || event.name || event.workshopName || "Untitled Event";
  const isTrip = type === "TRIP";
  const isWorkshop = type === "WORKSHOP";
  const isBazaar = type === "BAZAAR";
  const isConference = type === "CONFERENCE";
  const isBooth = type === "BOOTH";
  const hasPassed = new Date(event.startDateTime || event.startDate) < new Date();

  let eventImage = event.image;
  if (!eventImage || eventImage === "") {
    switch (type) {
      case "TRIP": eventImage = tripImage; break;
      case "WORKSHOP": eventImage = workshopPlaceholder; break;
      case "BAZAAR": eventImage = bazaarImage; break;
      case "CONFERENCE": eventImage = conferenceImage; break;
      case "BOOTH": eventImage = boothImage; break;
      default: eventImage = workshopPlaceholder; break;
    }
  }

  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="flex h-screen bg-[#f5efeb]">
      {/* Sidebar */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsSidebarOpen(false)}></div>}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#2f4156] text-white flex flex-col transform transition-transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#567c8d] rounded-full"></div>
            <span className="text-xl font-bold">EventHub</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-[#567c8d] rounded-lg"><Menu size={20} /></button>
        </div>
        <div className="flex-1 px-4 mt-4">
          <button onClick={() => { localStorage.removeItem("token"); navigate("/"); }} className="w-full flex items-center justify-center gap-2 bg-[#c88585] hover:bg-[#b87575] text-white py-3 px-4 rounded-lg">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4 flex items-center justify-between">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-[#f5efeb] rounded-lg"><Menu size={24} className="text-[#2f4156]" /></button>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-[#f5efeb] rounded-lg"><Bell size={20} className="text-[#567c8d]" /></button>
            <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center"><User size={20} className="text-[#2f4156]" /></div>
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-5xl mx-auto">
          <button onClick={() => navigate(-1)} className="mb-6 text-[#567c8d] hover:text-[#2f4156]">← Back to Events</button>

          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[#2f4156] mb-2">{title}</h1>
                {hasPassed && <p className="text-red-500 text-sm">This event has passed</p>}
              </div>
              <span className="bg-[#c8d9e6] text-[#2f4156] px-4 py-2 rounded-full text-sm font-medium">{type}</span>
            </div>

            <div className="h-64 w-full bg-gray-200 rounded-lg mb-6 overflow-hidden">
              <img src={eventImage} alt={title} className="h-full w-full object-cover" />
            </div>

            {/* RATINGS & REVIEWS SECTION */}
            <div className="mt-12 border-t pt-8">
              <h2 className="text-2xl font-bold text-[#2f4156] mb-6 flex items-center gap-2">
                <MessageCircle size={28} /> Ratings & Reviews {reviews.length > 0 && `(${reviews.length})`}
              </h2>

              {reviews.length > 0 && (
                <div className="flex items-center gap-4 mb-8 p-6 bg-[#f5efeb] rounded-xl">
                  <div className="text-5xl font-bold text-[#567c8d]">{avgRating}</div>
                  <div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} size={32} className={n <= avgRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">Based on {reviews.length} reviews</p>
                  </div>
                </div>
              )}

              {/* REVIEW BOX */}
              {canReview && (
                <div className="bg-[#f8f9fa] p-6 rounded-xl mb-8 border">
                  <h3 className="font-semibold text-[#2f4156] mb-4">Your Review</h3>
                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setMyRating(n)}>
                        <Star size={36} className={n <= myRating ? "fill-yellow-500 text-yellow-500" : "text-gray-400 hover:text-yellow-500 transition"} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    placeholder="Share your experience with this event..."
                    value={myComment}
                    onChange={(e) => setMyComment(e.target.value)}
                    className="w-full p-4 border border-[#c8d9e6] rounded-lg resize-none focus:ring-2 focus:ring-[#567c8d]"
                    rows={4}
                  />
                  <button onClick={submitReview} className="mt-4 px-6 py-3 bg-[#567c8d] hover:bg-[#45687a] text-white rounded-lg font-medium">
                    Submit Review
                  </button>
                </div>
              )}

              {!canReview && hasPassed && userId && (
                <p className="text-gray-500 italic mb-4">You cannot review this event (already reviewed or not eligible).</p>
              )}

              <div className="space-y-6">
                {reviewsLoading ? (
                  <p className="text-gray-500">Loading reviews...</p>
                ) : reviews.length === 0 ? (
                  <p className="text-gray-500 italic text-center py-8">No reviews yet. Be the first to review!</p>
                ) : (
                  reviews.map((r, i) => (
                    <div key={i} className="bg-[#fdfdfd] p-6 rounded-xl border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-[#567c8d] rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {r.userName?.[0] || "A"}
                          </div>
                          <div>
                            <p className="font-semibold text-[#2f4156]">{r.userName || "Anonymous"}</p>
                            <p className="text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} size={20} className={n <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="text-[#567c8d] mt-2 leading-relaxed">{r.comment}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EventDetails;
