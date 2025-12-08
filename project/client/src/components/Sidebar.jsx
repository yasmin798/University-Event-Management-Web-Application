import React, { useEffect, useState } from "react";
import {
  LogOut,
  Calendar,
  Dumbbell,
  Store,
  FileText,
  BarChart2,
  Users,
  BarChartHorizontal,
  MessageCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import EventityLogo from "./EventityLogo";

export default function Sidebar({ onOpenDocuments }) {
  const navigate = useNavigate();

  // Buttons that navigate to filtered events page
  const filterMenu = [
    ["All Events", "All", Calendar],
    ["Workshops", "WORKSHOP", Calendar],
    ["Bazaars", "BAZAAR", Store],
    ["Trips", "TRIP", Calendar],
    ["Conferences", "CONFERENCE", Calendar],
    ["Booths", "BOOTH", Store],
  ];

  // Buttons that go to other pages (static)
  const baseNavigation = [
    ["Gym Sessions", "/gym-sessions", Dumbbell],
    ["Vendor Booths", "/vendor-requests-booths", Store],
    ["Student Suggestions", "/events-office/suggestions", MessageCircle],
    ["Attendees Report", "/reports/attendees", FileText],
    ["Sales Report", "/reports/sales", BarChart2],
    ["Poll Results", "/poll-results", BarChartHorizontal],
  ];

  const [navigationMenu, setNavigationMenu] = useState(baseNavigation);
  const [userRole, setUserRole] = useState(null);

  // Roles that should see the Loyalty Partners button
  const allowedRoles = new Set([
    "student",
    "staff",
    "ta",
    "professor",
    "events_office",
    "admin",
  ]);

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem("user") || localStorage.getItem("currentUser");
      if (!raw) return setNavigationMenu(baseNavigation);
      const u = JSON.parse(raw);
      const role = u && u.role ? String(u.role).toLowerCase() : null;
      setUserRole(role);
      if (role && allowedRoles.has(role)) {
        // Start with base menu
        const menu = [...baseNavigation];

        // Place Loyalty Partners before reports
        menu.splice(2, 0, ["Loyalty Partners", "/vendors/loyalty", Users]);

        // For Events Office/Admin, add quick create actions in sidebar
        if (role === "events_office" || role === "admin") {
          // Add right after Gym Sessions for visibility
          menu.splice(1, 0, ["Create Gym", "/gym-manager", Dumbbell]);
          menu.splice(2, 0, [
            "Create Poll",
            "/create-poll",
            BarChartHorizontal,
          ]);
        }
        setNavigationMenu(menu);
      } else {
        setNavigationMenu(baseNavigation);
      }
    } catch (e) {
      setNavigationMenu(baseNavigation);
    }
  }, []);

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-[#2f4156] text-white shadow-lg flex flex-col z-50">
      {/* LOGO */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div style={{ marginTop: "8px" }}>
            <EventityLogo size={35} showText={false} />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 800 }}>EventHub</h2>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* FILTER BUTTONS */}
        {filterMenu.map(([label, type, Icon]) => (
          <button
            key={label}
            onClick={() =>
              navigate(type === "All" ? "/events" : `/events?filter=${type}`)
            }
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-white/5"
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}

        {/* STATIC NAVIGATION */}
        {navigationMenu.map(([label, route, Icon]) => (
          <button
            key={label}
            onClick={() => navigate(route)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-white/5"
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}

        {/* DOCUMENTS BUTTON - Only for Events Office/Admin */}
        {(userRole === "events_office" || userRole === "admin") && (
          <button
            onClick={() => navigate("/documents")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-white/5"
          >
            <FileText size={18} />
            <span>Documents</span>
          </button>
        )}
      </nav>

      {/* LOGOUT */}
      <div className="px-3 pb-8 pt-4 border-t border-white/10 mt-auto">
        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/20"
        >
          <LogOut size={30} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
