import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Menu, Bell, User, LogOut } from "lucide-react";
import workshopPlaceholder from "../images/workshop.png";
import EventTypeDropdown from "../components/EventTypeDropdown";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("All");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch all events
  useEffect(() => {
  const fetchEvents = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/events/all"); // must match backend
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };
  fetchEvents();
}, []);

const formatEventDate = (dateTimeStr) => {
  if (!dateTimeStr) return "N/A";
  // Take only the first 10 characters: YYYY-MM-DD
  const datePart = dateTimeStr.slice(0, 10);
  return new Date(datePart).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};



  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) navigate("/");
  };
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Filter events based on search and type
  const filteredEvents = events.filter((e) => {
    const name = e.title || e.name || e.workshopName || e.bazaarName;
    const matchesSearch =
      name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.professorsParticipating?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesType = eventTypeFilter === "All" || e.type === eventTypeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="flex h-screen bg-[#f5efeb]">
      {/* Sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        ></div>
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#2f4156] text-white flex flex-col transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
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
            <Menu size={20} />
          </button>
        </div>
        <div className="flex-1 px-4 mt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-[#c88585] hover:bg-[#b87575] text-white py-3 px-4 rounded-lg transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors"
          >
            <Menu size={24} className="text-[#2f4156]" />
          </button>

          <div className="relative flex-1 max-w-md flex items-center">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#567c8d]"
              size={20}
            />
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
          <h1 className="text-2xl md:text-3xl font-bold text-[#2f4156] mb-6">
            Available Events
          </h1>

          {filteredEvents.length === 0 ? (
            <p className="text-[#567c8d]">No events found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredEvents.map((e) => (
             <div
                key={e._id}
                className="bg-[#fdfdfd] border border-[#c8d9e6] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="h-40 w-full bg-gray-200">
                  <img
                    src={e.image || workshopPlaceholder}
                    alt={e.title || e.name || e.workshopName}
                    className="h-full w-full object-cover"
                  />
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
                    Date: {new Date(e.startDate || e.date).toLocaleDateString()}
                  </p>

                  {/* Buttons */}
                  <div className="flex gap-2 mt-4">
                    {/* Details Button */}
                    <button
                      className="flex-1 bg-[#567c8d] hover:bg-[#45687a] text-white py-2 px-3 rounded-lg transition-colors"
                      onClick={() => navigate(`/events/${e._id}?type=${e.type}`)}
                    >
                      Details
                    </button>

                    {/* Register Button (only for trips/workshops) */}
                    {(e.type === "Trip" || e.type === "Workshop") && (
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

export default StaffDashboard;
