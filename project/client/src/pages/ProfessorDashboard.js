import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ProfessorSidebar from "../components/ProfessorSidebar";
import {
  Search,
  Menu,
  User,
  Calendar,
  Clock,
  Users,
  FileText,
  LogOut,
  X,
  MapPin,
  Bell,
  Heart,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import ProfessorMonthCalendar from "../components/ProfessorMonthCalendar";
import boothPlaceholder from "../images/booth.jpg";
import conferenceImg from "../images/Conferenceroommeetingconcept.jpeg";
import tripImg from "../images/Womanlookingatmapplanningtrip.jpeg";
import bazaarImg from "../images/Arabbazaarisolatedonwhitebackground_FreeVector.jpeg";
import workshopImg from "../images/download(12).jpeg";
import { workshopAPI } from "../api/workshopApi";
import EventTypeDropdown from "../components/EventTypeDropdown";
import SearchableDropdown from "../components/SearchableDropdown";
import { useServerEvents } from "../hooks/useServerEvents";
import { boothAPI } from "../api/boothApi"; // make sure you created boothApi.js
import NotificationsDropdown from "../components/NotificationsDropdown";
import { Wallet } from "lucide-react";
const now = new Date();
const ProfessorDashboard = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workshops, setWorkshops] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [professorFilter, setProfessorFilter] = useState("");
  // Fixed sidebar is rendered via ProfessorSidebar component
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  // Notifications handled by shared NotificationsDropdown component
  const [eventTypeFilter, setEventTypeFilter] = useState("All");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [workshopsLoading, setWorkshopsLoading] = useState(true);
  const [booths, setBooths] = useState([]);
  const [boothsLoading, setBoothsLoading] = useState(true);
  // Debounced inputs to avoid refetching on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Use same hooks as EventsHome
  const { events: otherEvents, loading: otherLoading } = useServerEvents({
    refreshMs: 0,
  });

  const fetchBooths = useCallback(async () => {
    setBoothsLoading(true);
    try {
      const data = await boothAPI.getAllBooths();

      const normalizedBooths = data.map((b) => ({
        _id: b._id,
        type: "BOOTH",
        title: b.attendees?.[0]?.name || `Booth ${b._id}`,
        image: b.image || boothPlaceholder, // ✅ use boothPlaceholder instead of workshopPlaceholder
        description: b.description || "",
        startDateTime: now.toISOString(),
        startDate: now.toISOString(),
        date: now.toISOString(),
      }));

      setBooths(normalizedBooths);
    } catch (err) {
      console.error("Error fetching booths:", err);
      setBooths([]);
    } finally {
      setBoothsLoading(false);
    }
  }, []);

  // Fetch workshops same way as EventsHome
  const fetchWorkshops = useCallback(async () => {
    setWorkshopsLoading(true);
    try {
      const data = await workshopAPI.getAllWorkshops();

      const normalizedWorkshops = data
        .filter((w) => w.status === "published")
        .map((w) => ({
          ...w,
          type: "WORKSHOP",
          title: w.workshopName,
          startDateTime: new Date(w.startDateTime).toISOString(),
          endDateTime: new Date(w.endDateTime).toISOString(),
          date: new Date(w.startDateTime).toISOString().split("T")[0],
          image: w.image || workshopImg,
          description: w.shortDescription,
        }));

      setWorkshops(normalizedWorkshops);
    } catch (err) {
      console.error("Error fetching workshops:", err);
      setWorkshops([]);
    } finally {
      setWorkshopsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkshops();
    fetchBooths();
  }, [fetchWorkshops, fetchBooths]);

  // Load favorites for professor/ta/staff
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

  // Combine events like EventsHome
  const allEvents = [
    ...otherEvents.filter((e) => !e.status || e.status === "published"),
    ...workshops,
    ...booths,
  ];

  // Extract unique filter options
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

  // Removed legacy notifications dropdown outside-click handler after refactor to shared component.

  // Navigate to registered events (used in sidebar)
  const handleRegisteredEvents = () => {
    navigate("/events/registered");
    closeSidebar(); // close the sidebar after navigation
  };

  const handleFavorites = () => {
    navigate("/favorites");
    closeSidebar();
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      navigate("/");
    }
  };
  // const allEvents = workshops
  // .filter(w => w.status === 'published') // only published for professors too if needed
  // .map((w) => {
  //   const startDateTime = new Date(w.startDateTime || w.startDate);
  //   const endDateTime = new Date(w.endDateTime || w.endDate);

  //   return {
  //     ...w,
  //     _id: w._id,
  //     type: 'WORKSHOP',
  //     title: w.workshopName,
  //     name: w.workshopName,
  //     startDateTime: startDateTime.toISOString(),
  //     endDateTime: endDateTime.toISOString(),
  //     image: w.image || workshopPlaceholder,
  //     description: w.shortDescription,
  //     professorsParticipating: Array.isArray(w.professorsParticipating) ? w.professorsParticipating.join(', ') : w.professorsParticipating,
  //     location: w.location,
  //     registrationDeadline: w.registrationDeadline
  //   };
  // });

  const filteredEvents = allEvents
    .filter((e) => {
      // Hide archived events
      if (e.status === "archived") return false;

      // Always show booths
      if (e.type === "BOOTH") return true;

      // Show all non-archived events (past + future)
      return true;
    })

    .filter((e) => {
      const name = e.title || e.name || e.workshopName || e.bazaarName;
      const matchesSearch =
        name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.professorsParticipating
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ??
          false);

      const matchesLocation = !searchLocation || e.location === searchLocation;

      const matchesProfessor =
        !professorFilter ||
        e.professorsParticipating === professorFilter ||
        e.facultyResponsible === professorFilter;

      const matchesType =
        eventTypeFilter === "All" || e.type === eventTypeFilter;

      // Filter by selected calendar date if one is selected
      let matchesCalendarDate = true;
      if (selectedCalendarDate) {
        const eventDate = new Date(e.startDateTime || e.startDate || e.date);
        matchesCalendarDate =
          eventDate.toDateString() === selectedCalendarDate.toDateString();
      }

      return (
        matchesSearch &&
        matchesLocation &&
        matchesProfessor &&
        matchesType &&
        matchesCalendarDate
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.startDateTime || a.startDate || a.date);
      const dateB = new Date(b.startDateTime || b.startDate || b.date);
      return sortOrder === "asc" ? dateB - dateA : dateA - dateB;
    });

  const handleGymSessions = () => {
    navigate("/gym-sessions");
    closeSidebar(); // Close sidebar after navigation
  };

  const handleDetails = (event) => {
    navigate(`/events/${event._id}`);
  };

  const formatDate = (date) => {
    const options = { day: "numeric", month: "long", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const getMonthYear = (date) => {
    const options = { month: "long", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Calculate how many weeks we need to display all days of the month
    const daysNeeded = firstDay + daysInMonth;
    const weeksNeeded = Math.ceil(daysNeeded / 7);
    const totalDays = weeksNeeded * 7;

    const days = [];
    const startDate = new Date(year, month, 1 - firstDay);

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const dateString = date.toDateString();
      const hasEvent = allEvents.some((event) => {
        const eventDate = new Date(
          event.startDateTime || event.startDate || event.date
        );
        return eventDate.toDateString() === dateString;
      });

      days.push({
        date: date.getDate(),
        fullDate: date,
        isCurrentMonth: date.getMonth() === month,
        isToday: dateString === new Date().toDateString(),
        hasEvent: hasEvent,
      });
    }

    return days;
  };

  const [filteredWorkshops, setFilteredWorkshops] = useState([]);
  const formatEventDate = (dateTimeStr) => {
    if (!dateTimeStr) return "N/A";
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    const term = debouncedSearch.toLowerCase().trim();

    if (!term) {
      setFilteredWorkshops(workshops);
      return;
    }

    const results = workshops.filter((w) => {
      const name = w.workshopName?.toLowerCase() || "";
      const location = w.location?.toLowerCase() || "";
      const description = w.shortDescription?.toLowerCase() || "";
      const professors =
        (Array.isArray(w.professorsParticipating)
          ? w.professorsParticipating.join(" ").toLowerCase()
          : w.professorsParticipating?.toLowerCase()) || "";
      const faculty = w.facultyResponsible?.toLowerCase() || "";

      return (
        name.includes(term) ||
        location.includes(term) ||
        description.includes(term) ||
        professors.includes(term) ||
        faculty.includes(term)
      );
    });

    setFilteredWorkshops(results);
  }, [debouncedSearch, workshops]);

  const closeSidebar = () => {};
  const toggleSidebar = () => {};
  const closeModal = () => setSelectedWorkshop(null);

  // 🔔 Notifications state
  // Removed local notifications logic; using NotificationsDropdown instead.

  return (
    <div className="events-theme flex min-h-screen bg-[#f5efeb] ml-[260px]">
      <ProfessorSidebar />

      {/* Workshop Details Modal */}
      {selectedWorkshop && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-[#c8d9e6] p-6 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-[#2f4156]">
                {selectedWorkshop.workshopName}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors"
              >
                <X size={24} className="text-[#567c8d]" />
              </button>
            </div>

            <div className="p-6">
              {/* Date and Time */}
              <div className="mb-6">
                <div className="flex items-start gap-3 mb-3">
                  <button
                    onClick={() => {
                      navigate("/favorites");
                      closeSidebar();
                    }}
                    className="w-full flex items-center gap-3 bg-[#567c8d] hover:bg-[#45687a] text-white py-3 px-4 rounded-lg transition-colors text-left"
                  >
                    <Heart size={18} />
                    Favorites
                  </button>
                  <Calendar
                    size={20}
                    className="text-[#567c8d] mt-1 flex-shrink-0"
                  />
                  <div>
                    <p className="font-semibold text-[#2f4156]">Date & Time</p>
                    <p className="text-[#567c8d]">
                      {new Date(
                        selectedWorkshop.startDateTime
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-[#567c8d]">
                      {new Date(
                        selectedWorkshop.startDateTime
                      ).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(
                        selectedWorkshop.endDateTime
                      ).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 mb-3">
                  <MapPin
                    size={20}
                    className="text-[#567c8d] mt-1 flex-shrink-0"
                  />
                  <div>
                    <p className="font-semibold text-[#2f4156]">Location</p>
                    <p className="text-[#567c8d]">
                      {selectedWorkshop.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 mb-3">
                  <Users
                    size={20}
                    className="text-[#567c8d] mt-1 flex-shrink-0"
                  />
                  <div>
                    <p className="font-semibold text-[#2f4156]">Professor(s)</p>
                    <p className="text-[#567c8d]">
                      {selectedWorkshop.professorsParticipating}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock
                    size={20}
                    className="text-[#567c8d] mt-1 flex-shrink-0"
                  />
                  <div>
                    <p className="font-semibold text-[#2f4156]">
                      Registration Deadline
                    </p>
                    <p className="text-[#567c8d]">
                      {new Date(
                        selectedWorkshop.registrationDeadline
                      ).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-[#2f4156] mb-2">
                  Description
                </h3>
                <p className="text-[#567c8d] leading-relaxed">
                  {selectedWorkshop.shortDescription}
                </p>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#f5efeb] rounded-lg p-4">
                  <p className="text-sm text-[#567c8d] mb-1">Faculty</p>
                  <p className="font-semibold text-[#2f4156]">
                    {selectedWorkshop.facultyResponsible}
                  </p>
                </div>
                <div className="bg-[#f5efeb] rounded-lg p-4">
                  <p className="text-sm text-[#567c8d] mb-1">Capacity</p>
                  <p className="font-semibold text-[#2f4156]">
                    {selectedWorkshop.capacity} participants
                  </p>
                </div>
                <div className="bg-[#f5efeb] rounded-lg p-4">
                  <p className="text-sm text-[#567c8d] mb-1">Budget</p>
                  <p className="font-semibold text-[#2f4156]">
                    {selectedWorkshop.requiredBudget} EGP
                  </p>
                </div>
                <div className="bg-[#f5efeb] rounded-lg p-4">
                  <p className="text-sm text-[#567c8d] mb-1">Funding</p>
                  <p className="font-semibold text-[#2f4156]">
                    {selectedWorkshop.fundingSource}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    closeModal();
                    navigate(
                      `/professor/workshops/edit/${selectedWorkshop._id}`
                    );
                  }}
                  className="flex-1 px-6 py-3 bg-[#567c8d] text-white rounded-lg hover:bg-[#2f4156] transition-colors"
                >
                  Edit Workshop
                </button>
                <button
                  onClick={closeModal}
                  className="px-6 py-3 bg-[#c88585] hover:bg-[#b87575] text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed sidebar injected; content area continues below */}

      {/* Main Section */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {/* Sidebar is fixed; menu button removed */}

              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#567c8d]"
                  size={22}
                />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-base border border-[#c8d9e6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#567c8d]"
                />
              </div>

              <div className="w-40">
                <SearchableDropdown
                  options={uniqueLocations}
                  value={searchLocation}
                  onChange={setSearchLocation}
                  placeholder="All Locations"
                  label="Location"
                  icon={MapPin}
                />
              </div>

              <div className="w-40">
                <SearchableDropdown
                  options={uniqueProfessors}
                  value={professorFilter}
                  onChange={setProfessorFilter}
                  placeholder="All Professors"
                  label="Professor"
                  icon={Users}
                />
              </div>

              <div className="w-36">
                <EventTypeDropdown
                  selected={eventTypeFilter}
                  onChange={setEventTypeFilter}
                />
              </div>
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

            <div className="flex items-center gap-2 md:gap-4">
              <span className="hidden md:block text-[#567c8d] text-sm ml-4 whitespace-nowrap">
                Today, {formatDate(currentDate)}
              </span>
              <NotificationsDropdown align="right" />
              <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center">
                <User size={20} className="text-[#2f4156]" />
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-[#2f4156] mb-1">
                  Welcome back, Professor! 👋
                </h1>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-[#2f4156] mb-6">
                Available Events
              </h2>
              {filteredEvents.length === 0 ? (
                <p className="text-[#567c8d]">No events found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredEvents.map((e) => (
                    <div
                      key={e._id}
                      className="bg-[#fdfdfd] border border-[#c8d9e6] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="h-40 w-full bg-gray-200 relative">
                        <img
                          src={
                            e.type === "TRIP"
                              ? tripImg
                              : e.type === "BAZAAR"
                              ? bazaarImg
                              : e.type === "CONFERENCE"
                              ? conferenceImg
                              : e.type === "BOOTH"
                              ? e.image || boothPlaceholder
                              : workshopImg
                          }
                          alt={
                            e.title ||
                            e.name ||
                            e.workshopName ||
                            e.bazaarName ||
                            e.tripName ||
                            e.conferenceName
                          }
                          className="h-full w-full object-cover"
                          onError={(target) => {
                            target.target.src =
                              e.type === "TRIP"
                                ? tripImg
                                : e.type === "BAZAAR"
                                ? bazaarImg
                                : e.type === "CONFERENCE"
                                ? conferenceImg
                                : e.type === "BOOTH"
                                ? boothPlaceholder
                                : workshopImg;
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
                          {e.title || e.name || e.workshopName || "Untitled"}
                        </h3>
                        {e.professorsParticipating && (
                          <p className="text-sm text-[#567c8d] truncate">
                            Professors: {e.professorsParticipating}
                          </p>
                        )}
                        <p className="text-sm text-[#567c8d] truncate">
                          <p className="text-sm text-[#567c8d] truncate">
                            Type:{" "}
                            {e.workshopName ? "WORKSHOP" : e.type || "N/A"}
                          </p>
                        </p>
                        <p className="text-sm text-[#567c8d] truncate">
                          Date:{" "}
                          {formatEventDate(
                            e.startDateTime || e.startDate || e.date
                          )}
                        </p>
                        <div className="flex gap-2 mt-4">
                          <button
                            className="flex-1 bg-[#567c8d] hover:bg-[#45687a] text-white py-2 px-3 rounded-lg transition-colors"
                            onClick={() => handleDetails(e)}
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calendar & Upcoming Events */}
            <div className="w-full lg:w-96">
              <ProfessorMonthCalendar
                events={allEvents}
                selectedDate={selectedCalendarDate}
                onSelectDate={(d) => {
                  const isSame =
                    selectedCalendarDate &&
                    d.toDateString() === selectedCalendarDate.toDateString();
                  setSelectedCalendarDate(isSame ? null : d);
                }}
              />

              <div className="bg-white rounded-xl p-6 border border-[#c8d9e6]">
                <h3 className="text-lg font-bold text-[#2f4156] mb-4">
                  Upcoming Workshops
                </h3>
                {workshops.filter((w) => new Date(w.startDateTime) > new Date())
                  .length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-[#c8d9e6] rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock size={24} className="text-[#567c8d]" />
                    </div>
                    <p className="text-[#567c8d] text-sm">
                      No upcoming workshops
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {workshops
                      .filter((w) => new Date(w.startDateTime) > new Date())
                      .sort(
                        (a, b) =>
                          new Date(a.startDateTime) - new Date(b.startDateTime)
                      )
                      .slice(0, 3)
                      .map((w) => (
                        <li
                          key={w._id}
                          className="p-4 border border-[#c8d9e6] rounded-lg hover:bg-[#f5efeb] transition-colors cursor-pointer flex justify-between items-center"
                          onClick={() => setSelectedWorkshop(w)}
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-[#2f4156] truncate">
                              {w.workshopName}
                            </h4>
                            <p className="text-sm text-[#567c8d] truncate">
                              {w.location} •{" "}
                              {new Date(w.startDateTime).toLocaleDateString()}
                            </p>
                          </div>
                          <Calendar
                            size={18}
                            className="text-[#567c8d] ml-2 flex-shrink-0"
                          />
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfessorDashboard;
