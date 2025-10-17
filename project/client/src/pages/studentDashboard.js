import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Menu, Bell, User, LogOut, Calendar , Map} from "lucide-react";
import { useServerEvents } from "../hooks/useServerEvents";
import { workshopAPI } from "../api/workshopApi";
import workshopPlaceholder from "../images/workshop.png";
import EventTypeDropdown from "../components/EventTypeDropdown";
import { boothAPI } from "../api/boothApi"; // make sure you created boothApi.js

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("All");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [workshops, setWorkshops] = useState([]);
  const [workshopsLoading, setWorkshopsLoading] = useState(true);
const [booths, setBooths] = useState([]);
const [boothsLoading, setBoothsLoading] = useState(true);

  // Use same hooks as EventsHome
  const { events: otherEvents, loading: otherLoading } = useServerEvents({ refreshMs: 0 });


const fetchBooths = useCallback(async () => {
  setBoothsLoading(true);
  try {
    const data = await boothAPI.getAllBooths();

    const normalizedBooths = data.map(b => ({
      ...b,
      _id: b._id,
      type: "BOOTH",
      title: `${b.bazaar?.title} Booth`,
      startDateTime: b.bazaar?.startDateTime,
      endDateTime: b.bazaar?.endDateTime,
      date: b.bazaar?.startDateTime,
      image: b.image || workshopPlaceholder,
      description: b.bazaar?.shortDescription || "",
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
      .map((w) => {
        const start = new Date(w.startDateTime);
        const end = new Date(w.endDateTime);

        return {
          ...w,
          _id: w._id,
          type: "WORKSHOP",
          title: w.workshopName,
          name: w.workshopName,
          startDateTime: start.toISOString(),
          endDateTime: end.toISOString(),
          startDate: start.toISOString(), // for compatibility
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
}, []);


  useEffect(() => {
    fetchWorkshops();
    fetchBooths();
}, [fetchWorkshops, fetchBooths]);

  // Combine events like EventsHome
  const allEvents = [...otherEvents.filter(e => !e.status || e.status === "published"), ...workshops];
  const loading = otherLoading || workshopsLoading;

  const formatEventDate = (dateTimeStr) => {
    if (!dateTimeStr) return "N/A";
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter events (only future published events)
  const filteredEvents = allEvents
    .filter((e) => {
      const now = new Date();
      const eventDate = new Date(e.startDateTime || e.startDate || e.date);
      return eventDate > now; // Only future events
    })
    .filter((e) => {
      const name = e.title || e.name || e.workshopName || e.bazaarName;
      const matchesSearch =
        name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.professorsParticipating?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesType = eventTypeFilter === "All" || e.type === eventTypeFilter;
      return matchesSearch && matchesType;
    });

  const handleRegisteredEvents = () => {
    navigate("/events/registered");
    closeSidebar();
  };

// Update this function
const handleCourtsAvailability = () => {
  navigate("/courts-availability"); // Change this line from "/courts/availability" to "/courts-availability"
  closeSidebar();
};

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) navigate("/");
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Navigate to unified event details
  const handleDetails = (event) => {
    navigate(`/events/${event._id}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#f5efeb] items-center justify-center">
        <p className="text-[#567c8d]">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f5efeb]">
      {/* Sidebar - unchanged */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={closeSidebar}></div>
      )}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#2f4156] text-white flex flex-col transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#567c8d] rounded-full"></div>
            <span className="text-xl font-bold">EventHub</span>
          </div>
          <button onClick={closeSidebar} className="p-2 hover:bg-[#567c8d] rounded-lg transition-colors">
            <Menu size={20} />
          </button>
        </div>
        <div className="flex-1 px-4 mt-4 space-y-2">
          <button
            onClick={handleRegisteredEvents}
            className="w-full flex items-center gap-3 bg-[#567c8d] hover:bg-[#45687a] text-white py-3 px-4 rounded-lg transition-colors text-left"
          >
            <Calendar size={18} />
            Registered Events
          </button>
          <button
  onClick={handleCourtsAvailability}
  className="w-full flex items-center gap-3 bg-[#567c8d] hover:bg-[#45687a] text-white py-3 px-4 rounded-lg transition-colors text-left"
>
  <Map size={18} />
  Courts Availability
</button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-[#c88585] hover:bg-[#b87575] text-white py-3 px-4 rounded-lg transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Main content - header unchanged */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4 flex items-center justify-between">
          <button onClick={toggleSidebar} className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors">
            <Menu size={24} className="text-[#2f4156]" />
          </button>
          <div className="relative flex-1 max-w-md flex items-center">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#567c8d]" size={20} />
            <input
              type="text"
              placeholder="Search by name or professor"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#c8d9e6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#567c8d]"
            />
            <EventTypeDropdown selected={eventTypeFilter} onChange={setEventTypeFilter} />
          </div>
          <div className="flex items-center gap-2 md:gap-4 ml-4">
            <button className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors">
              <Bell size={20} className="text-[#567c8d]" />
            </button>
            <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center">
              <User size={20} className="text-[#2f4156]" />
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#2f4156] mb-6">Available Events</h1>
          {filteredEvents.length === 0 ? (
            <p className="text-[#567c8d]">No events found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredEvents.map((e) => (
                <div key={e._id} className="bg-[#fdfdfd] border border-[#c8d9e6] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="h-40 w-full bg-gray-200">
                    <img
                      src={e.image || workshopPlaceholder}
                      alt={e.title || e.name || e.workshopName}
                      className="h-full w-full object-cover"
                      onError={(target) => { target.target.src = workshopPlaceholder; }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-[#2f4156] truncate">
                      {e.title || e.name || e.workshopName || "Untitled"}
                    </h3>
                    {e.professorsParticipating && (
                      <p className="text-sm text-[#567c8d] truncate">Professors: {e.professorsParticipating}</p>
                    )}
                    <p className="text-sm text-[#567c8d] truncate">Type: {e.type || "N/A"}</p>
                    <p className="text-sm text-[#567c8d] truncate">
                      Date: {formatEventDate(e.startDateTime || e.startDate || e.date)}
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
                          onClick={() => navigate(`/events/register/${e._id}`)}
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
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;