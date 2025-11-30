import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  MessageCircle,
  MapPin,
  Calendar,
  Clock,
  Users,
  TrendingUp,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import boothPlaceholder from "../images/booth.jpg";
import workshopImg from "../images/download(12).jpeg";
import conferenceImg from "../images/Conferenceroommeetingconcept.jpeg";
import tripImg from "../images/Womanlookingatmapplanningtrip.jpeg";
import bazaarImg from "../images/Arabbazaarisolatedonwhitebackground_FreeVector.jpeg";
import { workshopAPI } from "../api/workshopApi";
import { boothAPI } from "../api/boothApi";
import { useServerEvents } from "../hooks/useServerEvents";

const API_BASE =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:3001";

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

function getEventImage(event) {
  if (event.image) return event.image;

  switch (event.type) {
    case "TRIP":
      return tripImg;
    case "BAZAAR":
      return bazaarImg;
    case "CONFERENCE":
      return conferenceImg;
    case "WORKSHOP":
      return workshopImg;
    case "BOOTH":
      return boothPlaceholder;
    default:
      return workshopImg;
  }
}

const DetailCard = ({ icon: Icon, label, value }) => (
  <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-2">
      <Icon size={20} className="text-[#567c8d]" />
      <p className="font-semibold text-gray-700">{label}</p>
    </div>
    <p className="text-gray-600 ml-8 break-words">{value}</p>
  </div>
);

export default function EventsHomeEventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events: otherEvents } = useServerEvents({ refreshMs: 0 });

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workshops, setWorkshops] = useState([]);
  const [booths, setBooths] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Fetch workshops
  useEffect(() => {
    const fetchWorkshops = async () => {
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
            description: w.shortDescription || w.description || "",
            shortDescription: w.shortDescription || w.description || "",
            professorsParticipating: w.professorsParticipating || "",
            status: w.status,
          };
        });
        setWorkshops(normalizedWorkshops);
      } catch (error) {
        console.error("Error fetching workshops:", error);
        setWorkshops([]);
      }
    };
    fetchWorkshops();
  }, []);

  // Fetch booths
  useEffect(() => {
    const fetchBooths = async () => {
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
      }
    };
    fetchBooths();
  }, []);

  // Fetch event details
  useEffect(() => {
    if (!id) return;

    const loadEvent = async () => {
      try {
        setLoading(true);

        // Try to find event in local state first
        const allEvents = [
          ...otherEvents.filter((e) => !e.status || e.status === "published"),
          ...workshops,
          ...booths,
        ];

        const foundEvent = allEvents.find(
          (e) => e._id?.toString() === id?.toString()
        );

        if (foundEvent) {
          setEvent(foundEvent);
          setError("");
        } else {
          // Try to fetch from API
          const types = ["workshop", "bazaar", "trip", "conference", "booth"];
          for (const t of types) {
            try {
              const res = await fetch(`${API_BASE}/api/events/${id}?type=${t}`);
              if (res.ok) {
                const data = await res.json();
                data.type = (t || data.type || "").toUpperCase();
                setEvent(data);
                setError("");
                break;
              }
            } catch (e) {
              // Continue to next type
            }
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading event:", err);
        setError("Failed to load event details");
        setLoading(false);
      }
    };

    loadEvent();
  }, [id, otherEvents, workshops, booths]);

  // Fetch reviews
  useEffect(() => {
    if (!id) return;

    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/events/${id}/reviews`);
        if (res.ok) {
          const data = await res.json();
          setReviews(Array.isArray(data) ? data : data.reviews || []);
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [id]);

  // Check if user is registered and can review
  useEffect(() => {
    if (!event) {
      return;
    }
  }, [event]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#567c8d] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Event not found"}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-[#567c8d] text-white px-6 py-2 rounded-lg hover:bg-[#45687a]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isWorkshop = event.type === "WORKSHOP";
  const isTrip = event.type === "TRIP";
  const isBazaar = event.type === "BAZAAR";
  const isConference = event.type === "CONFERENCE";
  const isBooth = event.type === "BOOTH";

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 ml-[260px]">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <h1 className="text-4xl font-bold text-gray-900">
              {event.title || event.name || "Event Details"}
            </h1>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 gap-6">
            {/* Main Section */}
            <div className="space-y-6">
              {/* Event Image */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <img
                  src={getEventImage(event)}
                  alt={event.title || event.name}
                  className="w-full h-64 object-cover"
                />
              </div>

              {/* Event Type & Description */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="mb-6">
                  <div className="inline-block px-4 py-2 bg-[#567c8d] text-white rounded-full text-sm font-semibold mb-4">
                    {event.type}
                  </div>
                  {event.status && isWorkshop && (
                    <div
                      className="inline-block ml-3 px-4 py-2 rounded-full text-sm font-semibold"
                      style={{
                        background:
                          event.status === "published"
                            ? "#e8f5e9"
                            : event.status === "rejected"
                            ? "#ffebee"
                            : "#fff3e0",
                        color:
                          event.status === "published"
                            ? "#2e7d32"
                            : event.status === "rejected"
                            ? "#c62828"
                            : "#f57c00",
                      }}
                    >
                      {event.status.charAt(0).toUpperCase() +
                        event.status.slice(1)}
                    </div>
                  )}
                </div>

                {(event.description || event.shortDescription) && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Description
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {event.description || event.shortDescription}
                    </p>
                  </div>
                )}
              </div>

              {/* Event Details Grid */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Event Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {/* For all events: Date/Time info */}
                  {(event.startDateTime || event.startDate) &&
                    event.type !== "BOOTH" && (
                      <>
                        <DetailCard
                          icon={Calendar}
                          label="Starts"
                          value={formatDate(
                            event.startDateTime || event.startDate
                          )}
                        />
                        {(event.endDateTime || event.endDate) && (
                          <DetailCard
                            icon={Clock}
                            label="Ends"
                            value={formatDate(
                              event.endDateTime || event.endDate
                            )}
                          />
                        )}
                      </>
                    )}

                  {/* Registration Deadline - for all event types */}
                  {event.registrationDeadline && (
                    <DetailCard
                      icon={Calendar}
                      label="Registration Deadline"
                      value={formatDate(event.registrationDeadline)}
                    />
                  )}

                  {/* Location */}
                  {event.location && (
                    <DetailCard
                      icon={MapPin}
                      label="Location"
                      value={event.location}
                    />
                  )}

                  {/* Trip Specific */}
                  {isTrip && (
                    <>
                      {event.price != null && (
                        <DetailCard
                          icon={TrendingUp}
                          label="Price"
                          value={formatMoney(event.price)}
                        />
                      )}
                      {event.capacity && (
                        <DetailCard
                          icon={Users}
                          label="Capacity"
                          value={event.capacity}
                        />
                      )}
                    </>
                  )}

                  {/* Workshop Specific */}
                  {isWorkshop && (
                    <>
                      {event.capacity && (
                        <DetailCard
                          icon={Users}
                          label="Capacity"
                          value={event.capacity}
                        />
                      )}
                      {event.budget && (
                        <DetailCard
                          icon={TrendingUp}
                          label="Required Budget"
                          value={formatMoney(event.budget)}
                        />
                      )}
                      {event.fundingSource && (
                        <DetailCard
                          icon={TrendingUp}
                          label="Funding Source"
                          value={event.fundingSource}
                        />
                      )}
                      {event.facultyResponsible && (
                        <DetailCard
                          icon={Users}
                          label="Faculty Responsible"
                          value={event.facultyResponsible}
                        />
                      )}
                      {event.professorsParticipating && (
                        <DetailCard
                          icon={Users}
                          label="Professors Participating"
                          value={event.professorsParticipating}
                        />
                      )}
                    </>
                  )}

                  {/* Conference Specific */}
                  {isConference && (
                    <>
                      {event.requiredBudget && (
                        <DetailCard
                          icon={TrendingUp}
                          label="Required Budget"
                          value={formatMoney(event.requiredBudget)}
                        />
                      )}
                      {event.fundingSource && (
                        <DetailCard
                          icon={Users}
                          label="Funding Source"
                          value={event.fundingSource}
                        />
                      )}
                      {event.website && (
                        <DetailCard
                          icon={MapPin}
                          label="Website"
                          value={
                            <a
                              href={event.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              {event.website}
                            </a>
                          }
                        />
                      )}
                    </>
                  )}

                  {/* Booth Specific */}
                  {isBooth && (
                    <>
                      {event.boothSize && (
                        <DetailCard
                          icon={TrendingUp}
                          label="Booth Size"
                          value={event.boothSize}
                        />
                      )}
                      {event.durationWeeks && (
                        <DetailCard
                          icon={Calendar}
                          label="Duration"
                          value={`${event.durationWeeks} weeks`}
                        />
                      )}
                      {event.platformSlot && (
                        <DetailCard
                          icon={MapPin}
                          label="Platform Slot"
                          value={event.platformSlot}
                        />
                      )}
                    </>
                  )}

                  {/* Bazaar Specific */}
                  {isBazaar && <></>}
                </div>

                {/* Extra Resources */}
                {event.extraResources && (
                  <div className="mt-6 bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Extra Resources
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {event.extraResources}
                    </p>
                  </div>
                )}

                {/* Full Agenda */}
                {event.fullAgenda && (
                  <div className="mt-4 bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Full Agenda
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {event.fullAgenda}
                    </p>
                  </div>
                )}
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

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviewsLoading ? (
                    <p className="text-gray-600 text-center py-4">
                      Loading reviews...
                    </p>
                  ) : reviews.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">
                      No reviews available.
                    </p>
                  ) : (
                    reviews.map((review, index) => (
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
                                {new Date(
                                  review.createdAt
                                ).toLocaleDateString()}
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
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
