import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Menu, Bell, User, LogOut } from "lucide-react";
import workshopPlaceholder from "../images/workshop.png";

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/events/details/${id}`);
        if (!res.ok) throw new Error("Failed to fetch event details");
        const data = await res.json();
        setEvent(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) navigate("/");
  };

  if (loading) return <p className="p-8 text-[#567c8d]">Loading event details...</p>;
  if (error) return <p className="p-8 text-red-500">{error}</p>;

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
          <button
            onClick={() => navigate(-1)}
            className="mb-4 text-[#567c8d] underline hover:text-[#2f4156]"
          >
            ← Back
          </button>

          <div className="bg-[#fdfdfd] border border-[#c8d9e6] rounded-2xl overflow-hidden shadow-sm p-6">
            <div className="h-60 w-full bg-gray-200 mb-4">
              <img
                src={event.image || workshopPlaceholder}
                alt={event.title || event.name}
                className="h-full w-full object-cover"
              />
            </div>

            <h1 className="text-2xl font-bold text-[#2f4156] mb-4">
              {event.title || event.name || "Untitled Event"}
            </h1>

            {Object.keys(event).map((key) => (
              <p key={key} className="text-sm text-[#567c8d] mb-1 break-words">
                <strong>{key}:</strong> {JSON.stringify(event[key])}
              </p>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default EventDetails;
