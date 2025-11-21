import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Menu,
  User,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Users,
  FileText,
  LogOut,
  X,
  MapPin,
  Bell,
  Heart,
} from "lucide-react";
import workshopPlaceholder from "../images/workshop.png";
import tripPlaceholder from "../images/trip.jpeg";
import bazaarPlaceholder from "../images/bazaar.jpeg";
import conferencePlaceholder from "../images/conference.jpg";
import boothPlaceholder from "../images/booth.jpg";
import { workshopAPI } from "../api/workshopApi";
import EventTypeDropdown from "../components/EventTypeDropdown";
import { useServerEvents } from "../hooks/useServerEvents";
import { boothAPI } from "../api/boothApi"; // make sure you created boothApi.js
const now = new Date();
const ProfessorDashboard = () => {
  const navigate = useNavigate();
  const [currentDate] = useState(new Date());
  const [workshops, setWorkshops] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const [eventTypeFilter, setEventTypeFilter] = useState("All");
  const [workshopsLoading, setWorkshopsLoading] = useState(true);
  const [booths, setBooths] = useState([]);
  const [boothsLoading, setBoothsLoading] = useState(true);

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
        .filter((w) => w.status === "published") // Only published for students
        .map((w) => {
          const startDatePart = w.startDate.split("T")[0];
          const startDateTime = new Date(`${startDatePart}T${w.startTime}:00`);
          const endDatePart = w.endDate.split("T")[0];
          const endDateTime = new Date(`${endDatePart}T${w.endTime}:00`);
          return {
            ...w,
            _id: w._id,
            type: "WORKSHOP",
            title: w.workshopName,
            name: w.workshopName,
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
            startDate: startDateTime.toISOString(), // For compatibility
            date: startDateTime.toISOString(), // For compatibility
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
  const loading = otherLoading || workshopsLoading;

  useEffect(() => {
    const fetchWorkshops = async () => {
      try {
        console.log("🔍 Fetching workshops...");
        const data = await workshopAPI.getAllWorkshops();
        console.log("✅ Workshops fetched:", data);
        console.log("📊 Number of workshops:", data.length);
        setWorkshops(data);
      } catch (error) {
        console.error("❌ Error fetching workshops:", error);
        console.error("Error details:", error.response?.data);
      }
    };

    fetchWorkshops();
  }, []);
  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    if (isNotificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationsOpen]);

  // Navigate to registered events (used in sidebar)
  const handleRegisteredEvents = () => {
    navigate("/events/registered");
    closeSidebar(); // close the sidebar after navigation
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
      if (e.type === "BOOTH") return true; // always show booths
      const eventDate = new Date(e.startDateTime || e.startDate || e.date);
      return eventDate > now; // Only future events
    })
    .filter((e) => {
      const name = e.title || e.name || e.workshopName || e.bazaarName;
      const matchesSearch =
        name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.professorsParticipating
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ??
          false);
      const matchesType =
        eventTypeFilter === "All" || e.type === eventTypeFilter;
      return matchesSearch && matchesType;
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
    const days = [];
    const startDate = new Date(year, month, 1 - firstDay);

    for (let i = 0; i < 35; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const dateString = date.toDateString();
      const hasWorkshop = workshops.some((workshop) => {
        const workshopDate = new Date(workshop.startDateTime);
        return workshopDate.toDateString() === dateString;
      });

      days.push({
        date: date.getDate(),
        fullDate: date,
        isCurrentMonth: date.getMonth() === month,
        isToday: dateString === new Date().toDateString(),
        hasWorkshop: hasWorkshop,
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
    const term = searchTerm.toLowerCase().trim();

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
  }, [searchTerm, workshops]);

  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeModal = () => setSelectedWorkshop(null);

  // 🔔 Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 🔹 Fetch notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("No token found, skipping notifications fetch.");
          return;
        }

        const res = await fetch("http://localhost:3000/api/notifications", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch notifications");

        const data = await res.json();
        console.log("✅ Notifications fetched:", data);

        const formatted = data.map((n) => ({
          id: n._id,
          message: n.message,
          time: new Date(n.createdAt).toLocaleString(),
          unread: n.unread,
          workshopName: n.workshopId?.workshopName || "General",
        }));

        setNotifications(formatted);
        setUnreadCount(formatted.filter((n) => n.unread).length);
      } catch (err) {
        console.error("❌ Error fetching notifications:", err);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <div className="flex h-screen bg-[#f5efeb]">
      {/* Overlay for Sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        ></div>
      )}

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

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50
        w-64 bg-[#2f4156] text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#567c8d] rounded-full"></div>
            <span className="text-xl font-bold">EventHub</span>
          </div>
          <button
            onClick={closeSidebar}
            className="p-2 hover:bg-[#567c8d] rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4">
          <button
            onClick={() => {
              navigate("/professor/dashboard");
              closeSidebar();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#567c8d] text-white mb-2"
          >
            <Menu size={20} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {
              navigate("/professor/workshops");
              closeSidebar();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#567c8d] mb-2 transition-colors"
          >
            <Calendar size={20} />
            <span>Workshops</span>
          </button>

          <button
            onClick={handleRegisteredEvents}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#567c8d] mb-2 transition-colors"
          >
            <Users size={20} />
            <span>Registered Events</span>
          </button>

          <button
            onClick={handleGymSessions}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#567c8d] mb-2 transition-colors"
          >
            <Calendar size={20} />
            <span>Gym Sessions</span>
          </button>

          <button
            onClick={() => {
              navigate("/professor/workshops/create");
              closeSidebar();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#567c8d] mb-2 transition-colors"
          >
            <FileText size={20} />
            <span>Create Workshop</span>
          </button>
        </nav>

        <div className="p-4 m-4 border-t border-[#567c8d]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-[#c88585] hover:bg-[#b87575] text-white py-3 px-4 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Section */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors"
              >
                <Menu size={24} className="text-[#2f4156]" />
              </button>

              <div className="relative flex-1 max-w-md">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#567c8d]"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search by workshop or professor"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#c8d9e6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#567c8d]"
                />
              </div>
              <EventTypeDropdown
                selected={eventTypeFilter}
                onChange={setEventTypeFilter}
              />
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <span className="hidden md:block text-[#567c8d] text-sm">
                Today, {formatDate(currentDate)}
              </span>
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors relative"
                >
                  <Bell size={24} className="text-[#2f4156]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-[#c88585] text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem]">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div
                    ref={notificationsRef}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#c8d9e6] z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-[#c8d9e6] flex items-center justify-between">
                      <h3 className="font-semibold text-[#2f4156]">
                        Notifications
                      </h3>
                      <button
                        onClick={() => setIsNotificationsOpen(false)}
                        className="text-[#567c8d] hover:text-[#2f4156]"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-[#567c8d]">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-4 border-b border-[#c8d9e6] hover:bg-[#f5efeb] transition-colors ${
                              notif.unread ? "bg-[#f5efeb]" : ""
                            }`}
                          >
                            <p className="text-sm text-[#2f4156] mb-1">
                              {notif.message}
                            </p>
                            <p className="text-xs text-[#567c8d]">
                              {notif.time}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    <button className="w-full p-3 text-[#567c8d] hover:bg-[#f5efeb] text-sm font-medium transition-colors">
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
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

              <div className="bg-white rounded-xl p-4 md:p-6 border border-[#c8d9e6] mb-8">
                <h2 className="text-xl font-bold text-[#2f4156] mb-6">
                  Workshops
                </h2>

                {filteredWorkshops.length === 0 ? (
                  <div className="text-center text-[#567c8d] py-6">
                    No workshops found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredWorkshops.map((workshop) => (
                      <div
                        key={workshop._id}
                        className="bg-[#fdfdfd] border border-[#c8d9e6] rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                        onClick={() =>
                          navigate(`/professor/workshops/edit/${workshop._id}`)
                        }
                      >
                        <div className="h-40 w-full bg-gray-200 relative">
                          <img
                            src={workshop.image || workshopPlaceholder}
                            alt={workshop.workshopName}
                            className="h-full w-full object-cover"
                          />
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation();
                              toggleFavorite(workshop._id);
                            }}
                            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                          >
                            <Heart
                              size={18}
                              className={
                                favorites.includes(workshop._id)
                                  ? "fill-red-500 text-red-500"
                                  : "text-gray-600"
                              }
                            />
                          </button>
                        </div>

                        <div className="p-4">
                          <h3 className="font-semibold text-lg text-[#2f4156] truncate">
                            {workshop.workshopName}
                          </h3>
                          <div className="flex items-center text-sm text-[#567c8d] mt-2">
                            <Calendar size={16} className="mr-1" />
                            <span>
                              {new Date(
                                workshop.startDateTime
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-[#567c8d] mt-1">
                            <Clock size={16} className="mr-1" />
                            <span className="truncate">
                              Deadline:{" "}
                              {workshop.registrationDeadline
                                ? new Date(
                                    workshop.registrationDeadline
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                            e.image ||
                            (e.type === "TRIP"
                              ? tripPlaceholder
                              : e.type === "BAZAAR"
                              ? bazaarPlaceholder
                              : e.type === "CONFERENCE"
                              ? conferencePlaceholder
                              : e.type === "BOOTH"
                              ? boothPlaceholder
                              : workshopPlaceholder)
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
                                ? tripPlaceholder
                                : e.type === "BAZAAR"
                                ? bazaarPlaceholder
                                : e.type === "CONFERENCE"
                                ? conferencePlaceholder
                                : e.type === "BOOTH"
                                ? boothPlaceholder
                                : workshopPlaceholder;
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
                          Type: {e.type || "N/A"}
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
                          {(e.type === "TRIP" || e.type === "WORKSHOP") && (
                            <button
                              className="flex-1 bg-[#c88585] hover:bg-[#b87575] text-white py-2 px-3 rounded-lg transition-colors"
                              onClick={() =>
                                navigate(`/events/register/${e._id}`)
                              }
                            >
                              Register
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calendar & Upcoming Events */}
            <div className="w-full lg:w-96">
              <div className="bg-white rounded-xl p-6 mb-6 border border-[#c8d9e6]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#2f4156]">
                    {getMonthYear(currentDate)}
                  </h3>
                  <div className="flex gap-2">
                    <button className="p-1 hover:bg-[#f5efeb] rounded transition-colors">
                      <ChevronLeft size={20} className="text-[#567c8d]" />
                    </button>
                    <button className="p-1 hover:bg-[#f5efeb] rounded transition-colors">
                      <ChevronRight size={20} className="text-[#567c8d]" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-semibold text-[#567c8d] py-2"
                      >
                        {day}
                      </div>
                    )
                  )}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {getCalendarDays().map((day, idx) => {
                    let bgColor = "hover:bg-[#f5efeb]";
                    let textColor = day.isCurrentMonth
                      ? "text-[#2f4156]"
                      : "text-[#c8d9e6]";

                    if (day.isToday) {
                      bgColor = "bg-[#567c8d]";
                      textColor = "text-white font-bold";
                    } else if (day.hasWorkshop && day.isCurrentMonth) {
                      // Check if it's an upcoming workshop
                      const isUpcoming = day.fullDate > new Date();
                      if (isUpcoming) {
                        bgColor = "bg-[#c8d9e6] hover:bg-[#b8c9d6]"; // Highlight color for upcoming
                        textColor = "text-[#2f4156] font-semibold";
                      } else {
                        bgColor = "bg-[#f5efeb] hover:bg-[#e5dfd8]"; // Lighter for past
                        textColor = "text-[#567c8d] font-semibold";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors relative
                          ${bgColor} ${textColor}
                        `}
                        title={
                          day.hasWorkshop
                            ? day.fullDate > new Date()
                              ? "Upcoming workshop"
                              : "Past workshop"
                            : ""
                        }
                      >
                        {day.date}
                        {day.hasWorkshop &&
                          day.isCurrentMonth &&
                          !day.isToday && (
                            <span
                              className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                                day.fullDate > new Date()
                                  ? "bg-[#567c8d]"
                                  : "bg-[#c8d9e6]"
                              }`}
                            ></span>
                          )}
                      </button>
                    );
                  })}
                </div>
              </div>

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
