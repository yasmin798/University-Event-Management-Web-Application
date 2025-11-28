// client/src/components/FixedSidebarAdmin.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Store,
  BarChart2,
  FileText,
  LogOut,
  BadgeCheck,
} from "lucide-react";

export default function FixedSidebarAdmin() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      navigate("/");
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <aside
      className="
        fixed left-0 top-0 h-screen w-[260px]
        bg-[#2f4156]              /* 👈 SAME COLOR AS EVENTS OFFICE */
        text-white
        shadow-lg
        flex flex-col
        z-50
      "
    >
      {/* Logo / title */}
      <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
          {/* Add your logo here */}
          <img src="/path-to-your-logo.png" alt="Logo" className="w-8 h-8" />
          <h1 className="text-xl font-bold tracking-wide">Admin</h1>
          
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <button
          onClick={() => navigate("/admin")}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
            ${isActive("/admin") ? "bg-white/15" : "hover:bg-white/5"}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => navigate("/admin/verified-users")}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
    ${isActive("/admin/verified-users") ? "bg-white/15" : "hover:bg-white/5"}`}
        >
          <BadgeCheck size={18} />
          <span>Verified Users</span>
        </button>
        <button
          onClick={() => navigate("/pending-verification")}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
    ${isActive("/pending-verification") ? "bg-white/15" : "hover:bg-white/5"}`}
        >
          <BadgeCheck size={18} />
          <span>Pending Verifications</span>
        </button>
        <button
          onClick={() => navigate("/admin/vendor-requests")}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
    ${isActive("/admin/vendor-requests") ? "bg-white/15" : "hover:bg-white/5"}`}
        >
          <BadgeCheck size={18} />
          <span>Vendor Requests Bazaar</span>
        </button>

        <button
          onClick={() => navigate("/admin/events")}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
    ${isActive("/admin/events") ? "bg-white/15" : "hover:bg-white/5"}`}
        >
          <BadgeCheck size={18} />
          <span>All Events</span>
        </button>
        <button
          onClick={() => navigate("/admin/attendees-report")}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
            ${
              isActive("/admin/attendees-report")
                ? "bg-white/15"
                : "hover:bg-white/5"
            }`}
        >
          <FileText size={18} />
          <span>Attendees Report</span>
        </button>

        <button
          onClick={() => navigate("/admin/sales-report")}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
            ${
              isActive("/admin/sales-report")
                ? "bg-white/15"
                : "hover:bg-white/5"
            }`}
        >
          <BarChart2 size={18} />
          <span>Sales Report</span>
        </button>

        <button
          onClick={() => navigate("/admin/loyalty-vendors")}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
            ${
              isActive("/admin/loyalty-vendors")
                ? "bg-white/15"
                : "hover:bg-white/5"
            }`}
        >
          <Store size={18} />
          <span>GUC Loyalty Partners</span>
        </button>

        <button
  onClick={() => navigate("/admin/vendor-requests-booths")}
  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
    ${isActive("/admin/vendor-requests-booths") ? "bg-white/15" : "hover:bg-white/5"}`}
>
  <Store size={18} />
  <span>Vendor Requests Booths</span>
</button>

      </nav>

      {/* Logout */}
      <div className="px-3 pb-8 pt-4 border-t border-white/10 mt-auto">
        {" "}
        {/* Added pb-8 and pt-4 for more padding */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/20"
        >
          <LogOut size={30} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
