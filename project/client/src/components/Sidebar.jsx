import React, { useEffect, useState } from "react";
import {
  LogOut,
  Calendar,
  Dumbbell,
  Store,
  FileText,
  BarChart2,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import EventityLogo from "./EventityLogo";

export default function Sidebar() {
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
    ["Attendees Report", "/reports/attendees", FileText],
    ["Sales Report", "/reports/sales", BarChart2],
  ];

  const [navigationMenu, setNavigationMenu] = useState(baseNavigation);

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
      if (role && allowedRoles.has(role)) {
        // insert Loyalty Partners after Vendor Booths
        const menu = [...baseNavigation];
        // place loyalty link before reports
        menu.splice(2, 0, ["Loyalty Partners", "/vendors/loyalty", Users]);
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
