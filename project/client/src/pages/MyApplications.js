// client/src/pages/VendorsPage.js
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Users,
  Calendar,
  FileText,
  LogOut,
  Bell,
  User as UserIcon,
  Search,
} from "lucide-react";

const VendorsPage = () => {
  const navigate = useNavigate();

  // ------- existing state -------
  const [bazaars, setBazaars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ------- new UI state (sidebar + notifications) -------
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);

  // sample notifications (optional)
  const notifications = [
    {
      id: 1,
      message: "Your booth application was received.",
      time: "2h ago",
      unread: true,
    },
    {
      id: 2,
      message: "Bazaar 'Autumn Fair' opens applications tomorrow.",
      time: "Yesterday",
      unread: false,
    },
  ];
  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };
    if (isNotificationsOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotificationsOpen]);

  const fetchBazaars = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/api/bazaars");
      if (!res.ok) throw new Error("Failed to fetch bazaars");
      const data = await res.json();
      const list = data.items || data || [];
      setBazaars(list);
      if (list.length === 0) setError("No upcoming bazaars found.");
    } catch (err) {
      console.error(err);
      setError("Error fetching bazaars. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen((v) => !v);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) navigate("/");
  };

  return (
    <div className="flex h-screen bg-[#f5efeb]">
      {/* Overlay for Sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar (only Logout) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#2f4156] text-white flex flex-col transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#567c8d] rounded-full" />
            <span className="text-xl font-bold">EventHub</span>
          </div>
          <button
            onClick={closeSidebar}
            className="p-2 hover:bg-[#567c8d] rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* (no nav items) */}
        <div className="flex-1" />

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
        {/* Header (same style) */}
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors"
              >
                <Menu size={24} className="text-[#2f4156]" />
              </button>

              {/* Optional search */}
              <div className="relative flex-1 max-w-md">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#567c8d]"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search bazaars…"
                  onChange={() => {}}
                  className="w-full pl-10 pr-4 py-2 border border-[#c8d9e6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#567c8d]"
                />
              </div>
            </div>

            {/* Avatar only (no bell, no dropdown) */}
            <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center">
              <UserIcon size={20} className="text-[#2f4156]" />
            </div>
          </div>
        </header>

        {/* Your original Vendors page content */}
        <main className="p-4 md:p-8">
          <h1 className="text-3xl font-bold text-[#2f4156] mb-6 text-center">
            Vendors Portal
          </h1>

          <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
            <button
              onClick={fetchBazaars}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-all"
            >
              Show Upcoming Bazaars
            </button>

            <Link
              to="/my-applications/accepted"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-all"
            >
              View Applications
            </Link>
          </div>

          {loading && (
            <p className="text-center text-gray-500 font-medium">Loading...</p>
          )}

          {error && !loading && (
            <p className="text-center text-red-500 font-medium">{error}</p>
          )}

          {!loading && !error && bazaars.length > 0 && (
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
              {bazaars.map((bazaar) => (
                <div
                  key={bazaar._id}
                  className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-all border border-gray-100"
                >
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    {bazaar.title}
                  </h2>
                  <p className="text-gray-600 mb-1">
                    <strong>Location:</strong> {bazaar.location}
                  </p>
                  <p className="text-gray-600 mb-1">
                    <strong>Start:</strong>{" "}
                    {new Date(bazaar.startDateTime).toLocaleString()}
                  </p>
                  <p className="text-gray-600 mb-1">
                    <strong>End:</strong>{" "}
                    {new Date(bazaar.endDateTime).toLocaleString()}
                  </p>
                  <p className="text-gray-600 mb-3">
                    <strong>Description:</strong>{" "}
                    {bazaar.shortDescription || "N/A"}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    <strong>Status:</strong>{" "}
                    <span className="capitalize">{bazaar.status}</span>
                  </p>

                  <div className="flex gap-3 justify-center">
                    <Link
                      to={`/apply/${bazaar._id}`}
                      className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium shadow-md"
                    >
                      Apply (General)
                    </Link>

                    <Link
                      to={`/apply-booth/${bazaar._id}`}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium shadow-md"
                    >
                      Apply for Booth
                    </Link>
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

export default VendorsPage;
