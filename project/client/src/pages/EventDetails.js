// client/src/pages/EventDetails.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import StudentSidebar from "../components/StudentSidebar"; // or StudentSidebar / VendorSidebar etc

import {
  Menu,
  Bell,
  User,
  LogOut,
  Star,
  MessageCircle,
  Heart,
  MapPin,
  Calendar,
  Clock,
  Users,
  ArrowLeft,
  Share2,
  Bookmark,
  Eye,
  TrendingUp,
  CheckCircle,
  X,
} from "lucide-react";
import { useServerEvents } from "../hooks/useServerEvents";
import { workshopAPI } from "../api/workshopApi";
import { boothAPI } from "../api/boothApi";

import workshopPlaceholder from "../images/workshop.png";
import boothPlaceholder from "../images/booth.jpg";
import conferenceImg from "../images/Conferenceroommeetingconcept.jpeg";
import tripImg from "../images/Womanlookingatmapplanningtrip.jpeg";
import bazaarImg from "../images/Arabbazaarisolatedonwhitebackground_FreeVector.jpeg";
import workshopImg from "../images/download(12).jpeg";

const API_BASE =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:3001";

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

  // Registration State
  const [isRegistered, setIsRegistered] = useState(false);
  const [canRegister, setCanRegister] = useState(false);
  const [hasPassed, setHasPassed] = useState(false);

  // Get current user's role from token
  const [userRole, setUserRole] = useState(null);
  const [isEventsOffice, setIsEventsOffice] = useState(false);

  // Favorites State
  const [isFavorite, setIsFavorite] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const { events: otherEvents } = useServerEvents({ refreshMs: 0 });

  // Get user ID and role from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserId(payload.id || payload.userId || payload._id);
        setUserRole(payload.role?.toLowerCase());
        setIsEventsOffice(payload.role?.toLowerCase() === "events_office");
      } catch (e) {
        console.error("Invalid token");
      }
    }
  }, []);

  // Check if event is in favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!userId || !userRole || userRole === "events_office") return;

      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/users/me/favorites", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          const favoriteIds = data.map((e) => e._id);
          setIsFavorite(favoriteIds.includes(id));
        }
      } catch (err) {
        console.error("Failed to fetch favorites", err);
      }
    };
    fetchFavorites();
  }, [userId, userRole, id]);

  // Fetch Reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/events/${id}/reviews`);
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

    const eventType = event.type?.toUpperCase();
    const alreadyReviewed = reviews.some(
      (r) => r.userId?.toString() === userId
    );

    const endDate =
      event.endDateTime ||
      event.endDate ||
      event.startDateTime ||
      event.startDate;
    const now = new Date();
    const hasEnded = endDate && new Date(endDate).getTime() <= now.getTime();

    if (["BOOTH", "BAZAAR", "CONFERENCE"].includes(eventType)) {
      setCanReview(!alreadyReviewed && hasEnded);
      return;
    }

    const hasPassedReview =
      new Date(event.endDateTime || event.startDateTime || event.startDate) <
      new Date();

    if (!hasPassedReview || alreadyReviewed) {
      setCanReview(false);
      return;
    }

    let isRegisteredReview = false;
    if (event.registeredUsers)
      isRegisteredReview = event.registeredUsers.some(
        (u) => u.toString() === userId
      );
    if (event.registrations)
      isRegisteredReview =
        isRegisteredReview ||
        event.registrations.some((r) => r.userId?.toString() === userId);

    setCanReview(isRegisteredReview);
  }, [event, reviews, userId]);

  // Registration logic
  useEffect(() => {
    if (!event || !userId) return;

    const now = new Date();
    const deadline = event.registrationDeadline
      ? new Date(event.registrationDeadline)
      : new Date(event.startDateTime || event.startDate);
    const hasPassedReg = deadline.getTime() < now.getTime();

    let isReg = false;
    if (event.registeredUsers)
      isReg = event.registeredUsers.some((u) => u.toString() === userId);
    if (event.registrations)
      isReg =
        isReg ||
        event.registrations.some((r) => r.userId?.toString() === userId);

    setIsRegistered(isReg);
    setHasPassed(hasPassedReg);
    setCanRegister(!isReg && !hasPassedReg);
  }, [event, userId]);

  // Check if user is allowed to register
  const allowedLower = (event?.allowedRoles || []).map((r) =>
    String(r).toLowerCase().trim()
  );
  const userRoleLower = String(userRole || "")
    .toLowerCase()
    .trim();
  const userIsAllowed =
    allowedLower.length === 0 ||
    allowedLower.includes(userRoleLower) ||
    userRoleLower === "events_office" ||
    isEventsOffice;

  const handleRegister = () => {
    navigate(`/events/${id}/register`);
  };

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!userId || userRole === "events_office") return;

    try {
      const token = localStorage.getItem("token");
      const method = isFavorite ? "DELETE" : "POST";
      const url = `/api/users/me/favorites${isFavorite ? `/${id}` : ""}`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: method === "POST" ? JSON.stringify({ eventId: id }) : null,
      });

      if (res.ok) {
        setIsFavorite(!isFavorite);
      }
    } catch (err) {
      console.error("Failed to toggle favorite", err);
    }
  };

  // Submit Review
  const submitReview = async () => {
    if (myRating === 0) {
      alert("Please select a star rating");
      return;
    }

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

      if (res.ok) {
        const updated = await res.json();
        setReviews(updated);
        setMyRating(0);
        setMyComment("");
        alert("Thank you for your review!");
      }
    } catch (err) {
      console.error("Network error:", err);
      alert("Network error. Check console for details.");
    }
  };

  // Booths and Workshops fetch (keep your existing code)
  useEffect(() => {
    const fetchBooths = async () => {
      setBoothsLoading(true);
      try {
        const data = await boothAPI.getAllBooths();
        const normalizedBooths = data.map((b) => ({
          _id: b._id,
          type: "BOOTH",
          bazaarId: b.bazaar?._id,
          title:
            b.attendees?.[0]?.name || `${b.bazaar?.title} Booth` || "Booth",
          attendees: b.attendees || [],
          boothSize: b.boothSize,
          durationWeeks: b.durationWeeks,
          platformSlot: b.platformSlot,
          status: b.status,
          description: b.description || "",
          registeredUsers: b.registeredUsers || [],
          registrations: b.registrations || [],
          image: b.image || boothPlaceholder,
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

  useEffect(() => {
    const fetchWorkshops = async () => {
      setWorkshopsLoading(true);
      try {
        const data = await workshopAPI.getAllWorkshops();
        const normalizedWorkshops = data.map((w) => {
          const start = w.startDateTime
            ? new Date(w.startDateTime)
            : new Date();
          const end = w.endDateTime ? new Date(w.endDateTime) : start;
          return {
            ...w,
            _id: w._id,
            type: "WORKSHOP",
            title: w.workshopName,
            name: w.workshopName,
            budget: w.requiredBudget,
            capacity: w.capacity,
            registrationDeadline: w.registrationDeadline,
            fundingSource: w.fundingSource,
            facultyResponsible: w.facultyResponsible,
            extraResources: w.extraResources,
            fullAgenda: w.fullAgenda,
            startDateTime: start.toISOString(),
            endDateTime: end.toISOString(),
            startDate: start.toISOString(),
            date: start.toISOString(),
            image: w.image || workshopImg,
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

  // Combine events (keep your existing code)
  useEffect(() => {
    if (loading || boothsLoading || workshopsLoading) return;

    const allEvents = [
      ...otherEvents.filter((e) => !e.status || e.status === "published"),
      ...workshops,
      ...booths,
    ];

    const foundEvent = allEvents.find(
      (e) => e._id?.toString() === id?.toString()
    );

    if (foundEvent) {
      if (foundEvent.type === "BAZAAR") {
        const eventBooths = booths.filter(
          (b) => b.bazaarId === id && b.status === "accepted"
        );
        foundEvent.booths = eventBooths;
      } else if (foundEvent.type === "BOOTH") {
        foundEvent.booths = [foundEvent];
      }
      setEvent(foundEvent);
      setError("");
    } else {
      const tryFetch = async () => {
        const types = ["workshop", "bazaar", "trip", "conference", "booth"];
        for (const t of types) {
          try {
            const res = await fetch(`${API_BASE}/api/events/${id}?type=${t}`);
            if (res.ok) {
              const data = await res.json();
              data.type = (t || data.type || "").toUpperCase();
              setEvent(data);
              setError("");
              return;
            }
          } catch (err) {
            console.debug("Event fetch attempt failed for type", t, err);
          }
        }

        setEvent(null);
        setError("Event not found");
      };

      tryFetch();
    }
  }, [
    id,
    otherEvents,
    workshops,
    booths,
    loading,
    boothsLoading,
    workshopsLoading,
  ]);

  useEffect(() => {
    const stillLoading =
      workshopsLoading || (otherEvents.length === 0 && workshops.length === 0);
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
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#567c8d] mx-auto mb-4"></div>
          <p className="text-[#567c8d]">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#2f4156] mb-4">
            Event Not Found
          </h2>
          <button
            onClick={() => navigate(-1)}
            className="bg-gradient-to-r from-[#567c8d] to-[#45687a] hover:from-[#45687a] hover:to-[#567c8d] text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
          >
            ← Back to Events
          </button>
        </div>
      </div>
    );
  }

  const type = event.type?.toUpperCase() || "EVENT";
  const title =
    type === "BOOTH"
      ? event.attendees?.[0]?.name ||
        event.title ||
        event.name ||
        "Untitled Booth"
      : event.title || event.name || event.workshopName || "Untitled Event";
  const isTrip = type === "TRIP";
  const isWorkshop = type === "WORKSHOP";
  const isBazaar = type === "BAZAAR";
  const isConference = type === "CONFERENCE";
  const isBooth = type === "BOOTH";

  let eventImage = event.image;
  if (!eventImage || eventImage === "") {
    switch (type) {
      case "TRIP":
        eventImage = tripImg;
        break;
      case "WORKSHOP":
        eventImage = workshopImg;
        break;
      case "BAZAAR":
        eventImage = bazaarImg;
        break;
      case "CONFERENCE":
        eventImage = conferenceImg;
        break;
      case "BOOTH":
        eventImage = boothPlaceholder;
        break;
      default:
        eventImage = workshopImg;
        break;
    }
  }

  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const DetailCard = ({ icon: Icon, label, value, className = "" }) => (
    <div
      className={`bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-[#567c8d] to-[#45687a] rounded-lg flex items-center justify-center">
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-600 font-medium">{label}</p>
          <p className="text-gray-900 font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <StudentSidebar />
      <div className="flex-1 ml-[250px]">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-6">
              <div>
                <span className="bg-gradient-to-r from-[#567c8d] to-[#45687a] text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {type}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Share2 size={20} className="text-[#567c8d]" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bookmark size={20} className="text-[#567c8d]" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-[#567c8d] to-[#45687a] rounded-full flex items-center justify-center text-white font-semibold">
                <User size={20} />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Event Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="relative h-80 w-full">
              <img
                src={eventImage}
                alt={title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

              {/* Header Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold text-white mb-3">
                      {title}
                    </h1>
                    <div className="flex items-center gap-4 text-white/90">
                      <div className="flex items-center gap-2">
                        <MapPin size={18} />
                        <span>
                          {event.location || "Location not specified"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={18} />
                        <span>{formatDate(event.startDateTime)}</span>
                      </div>
                      {event.capacity && (
                        <div className="flex items-center gap-2">
                          <Users size={18} />
                          <span>{event.capacity} spots</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    {userRole && userRole !== "events_office" && (
                      <button
                        onClick={toggleFavorite}
                        className="p-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all border border-white/30"
                        title={
                          isFavorite
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                      >
                        <Heart
                          size={24}
                          className={
                            isFavorite
                              ? "fill-red-500 text-red-500"
                              : "text-white"
                          }
                        />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="px-8 py-6 border-b border-gray-200">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl flex items-center justify-center">
                    <Star size={24} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {avgRating}
                    </p>
                    <p className="text-sm text-gray-600">Average Rating</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center">
                    <Eye size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {reviews.length}
                    </p>
                    <p className="text-sm text-gray-600">Reviews</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center">
                    <Users size={24} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {event.registrations?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600">Registered</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Section */}
            <div className="px-8 py-6">
              {!isRegistered && !hasPassed && (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Ready to join?
                    </h3>
                    <p className="text-gray-600">
                      Don't miss out on this amazing event
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {canRegister ? (
                      <button
                        onClick={handleRegister}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        disabled={!userIsAllowed}
                      >
                        Register Now
                      </button>
                    ) : (
                      <button
                        disabled
                        className="bg-gray-400 text-white px-8 py-3 rounded-xl font-semibold cursor-not-allowed"
                      >
                        Registration Closed
                      </button>
                    )}
                  </div>
                </div>
              )}

              {isRegistered && (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      You're registered! 🎉
                    </h3>
                    <p className="text-gray-600">
                      We're excited to see you at the event
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle size={24} />
                    <span className="font-semibold">Registered</span>
                  </div>
                </div>
              )}

              {/* Role Restriction Message */}
              {event?.allowedRoles?.length > 0 &&
                !userIsAllowed &&
                !isEventsOffice && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <X size={16} className="text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-yellow-800">
                          This event is restricted to:{" "}
                          {event.allowedRoles
                            .map(
                              (role) =>
                                role.charAt(0).toUpperCase() +
                                role.slice(1) +
                                "s"
                            )
                            .join(", ")}
                        </p>
                        <p className="text-yellow-700 text-sm mt-1">
                          Only selected roles can register for this event.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Event Details Grid */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#567c8d] to-[#45687a] rounded-lg flex items-center justify-center">
                    <Calendar size={18} className="text-white" />
                  </div>
                  Event Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Dynamic Details based on event type */}
                  {isTrip && (
                    <>
                      <DetailCard
                        icon={MapPin}
                        label="Location"
                        value={event.location || "—"}
                      />
                      <DetailCard
                        icon={TrendingUp}
                        label="Price"
                        value={formatMoney(event.price)}
                      />
                      <DetailCard
                        icon={Calendar}
                        label="Starts"
                        value={formatDate(event.startDateTime)}
                      />
                      <DetailCard
                        icon={Clock}
                        label="Ends"
                        value={formatDate(event.endDateTime)}
                      />
                      <DetailCard
                        icon={Users}
                        label="Capacity"
                        value={event.capacity || "—"}
                      />
                      <DetailCard
                        icon={Calendar}
                        label="Registration Deadline"
                        value={formatDate(event.registrationDeadline)}
                      />
                    </>
                  )}

                  {isConference && (
                    <>
                      <DetailCard
                        icon={Calendar}
                        label="Starts"
                        value={formatDate(event.startDateTime)}
                      />
                      <DetailCard
                        icon={Clock}
                        label="Ends"
                        value={formatDate(event.endDateTime)}
                      />
                      <DetailCard
                        icon={TrendingUp}
                        label="Required Budget"
                        value={formatMoney(event.requiredBudget)}
                      />
                      <DetailCard
                        icon={Users}
                        label="Funding Source"
                        value={event.fundingSource || "—"}
                      />
                      <DetailCard
                        icon={MapPin}
                        label="Website"
                        value={
                          event.website ? (
                            <a
                              href={event.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              {event.website}
                            </a>
                          ) : (
                            "—"
                          )
                        }
                      />
                      {event.extraResources && (
                        <div className="md:col-span-2 bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Extra Resources
                          </h3>
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {event.extraResources}
                          </p>
                        </div>
                      )}
                      {event.fullAgenda && (
                        <div className="md:col-span-2 bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Full Agenda
                          </h3>
                          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                            {event.fullAgenda}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {isWorkshop && (
                    <>
                      <DetailCard
                        icon={MapPin}
                        label="Location"
                        value={event.location || "—"}
                      />
                      <DetailCard
                        icon={Calendar}
                        label="Starts"
                        value={formatDate(event.startDateTime)}
                      />
                      <DetailCard
                        icon={Clock}
                        label="Ends"
                        value={formatDate(event.endDateTime)}
                      />
                      <DetailCard
                        icon={Calendar}
                        label="Registration Deadline"
                        value={formatDate(event.registrationDeadline)}
                      />
                      <DetailCard
                        icon={Users}
                        label="Capacity"
                        value={event.capacity || "—"}
                      />
                      <DetailCard
                        icon={TrendingUp}
                        label="Required Budget"
                        value={formatMoney(event.budget)}
                      />
                      <DetailCard
                        icon={Users}
                        label="Funding Source"
                        value={event.fundingSource || "—"}
                      />
                      <DetailCard
                        icon={Users}
                        label="Faculty Responsible"
                        value={event.facultyResponsible || "—"}
                      />
                      <DetailCard
                        icon={Users}
                        label="Professors Participating"
                        value={event.professorsParticipating || "—"}
                      />
                      {event.extraResources && (
                        <div className="md:col-span-2 bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Extra Resources
                          </h3>
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {event.extraResources}
                          </p>
                        </div>
                      )}
                      {event.fullAgenda && (
                        <div className="md:col-span-2 bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Full Agenda
                          </h3>
                          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                            {event.fullAgenda}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {isBooth && (
                    <>
                      <DetailCard
                        icon={TrendingUp}
                        label="Booth Size"
                        value={event.boothSize || "—"}
                      />
                      <DetailCard
                        icon={MapPin}
                        label="Platform Slot"
                        value={event.platformSlot || "—"}
                      />
                      <DetailCard
                        icon={Users}
                        label="Status"
                        value={event.status || "—"}
                      />
                    </>
                  )}

                  {isBazaar && (
                    <>
                      <DetailCard
                        icon={MapPin}
                        label="Location"
                        value={event.location || "—"}
                      />
                      <DetailCard
                        icon={Calendar}
                        label="Starts"
                        value={formatDate(event.startDateTime)}
                      />
                      <DetailCard
                        icon={Clock}
                        label="Ends"
                        value={formatDate(event.endDateTime)}
                      />
                      <DetailCard
                        icon={Calendar}
                        label="Registration Deadline"
                        value={formatDate(event.registrationDeadline)}
                      />
                    </>
                  )}

                  {/* Description */}
                  {(event.description || event.shortDescription) && (
                    <div className="md:col-span-2 bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Description
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {event.description || event.shortDescription}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#567c8d] to-[#45687a] rounded-lg flex items-center justify-center">
                    <MessageCircle size={18} className="text-white" />
                  </div>
                  Ratings & Reviews{" "}
                  {reviews.length > 0 && `(${reviews.length})`}
                </h2>

                {/* Review Input */}
                {canReview && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 mb-8">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Share Your Experience
                    </h3>
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => setMyRating(n)}
                          className="transform hover:scale-110 transition-transform"
                        >
                          <Star
                            size={32}
                            className={
                              n <= myRating
                                ? "fill-yellow-500 text-yellow-500"
                                : "text-gray-400 hover:text-yellow-500 transition-colors"
                            }
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      placeholder="Share your thoughts about this event..."
                      value={myComment}
                      onChange={(e) => setMyComment(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-[#567c8d] focus:border-transparent"
                      rows={4}
                    />
                    <button
                      onClick={submitReview}
                      className="mt-4 bg-gradient-to-r from-[#567c8d] to-[#45687a] hover:from-[#45687a] hover:to-[#567c8d] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Submit Review
                    </button>
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.map((review, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#567c8d] to-[#45687a] rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {review.userName?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {review.userName || "Anonymous"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              size={18}
                              className={
                                n <= review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Event Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Type</span>
                    <span className="font-semibold text-gray-900">{type}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Status</span>
                    <span
                      className={`font-semibold ${
                        hasPassed ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {hasPassed ? "Ended" : "Upcoming"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Your Status</span>
                    <span
                      className={`font-semibold ${
                        isRegistered ? "text-green-600" : "text-gray-600"
                      }`}
                    >
                      {isRegistered ? "Registered" : "Not Registered"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Share Card */}
              <div className="bg-gradient-to-br from-[#567c8d] to-[#45687a] rounded-2xl p-6 text-white">
                <h3 className="font-semibold mb-3">Share this event</h3>
                <p className="text-white/80 text-sm mb-4">
                  Let others know about this amazing event!
                </p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2 rounded-lg transition-colors text-sm font-medium">
                    Copy Link
                  </button>
                  <button className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2 rounded-lg transition-colors text-sm font-medium">
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EventDetails;
