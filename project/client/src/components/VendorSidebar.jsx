import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Store,
  FileText,
  Users,
  LogOut,
  X,
  IdCard,
  IdCardIcon,
} from "lucide-react";
import EventityLogo from "./EventityLogo";

export default function VendorSidebar({
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  fetchBazaars,
}) {
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={`
        fixed left-0 top-0 h-screen w-[260px] bg-[#2f4156] text-white shadow-lg flex flex-col z-50
        transition-transform duration-300
        ${
          isMobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }
      `}
      >
        {/* LOGO */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div style={{ marginTop: "8px" }}>
              <EventityLogo size={35} showText={false} />
            </div>
            <h2 className="text-[22px] font-extrabold">Vendor Hub</h2>
          </div>

          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <button
            onClick={() => navigate("/vendors")} // <── FIXED
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-white/5"
          >
            <Calendar size={18} />
            <span>Upcoming Bazaars</span>
          </button>
          <button
            onClick={() => navigate("/apply-booth")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-white/5"
          >
            <Store size={18} />
            <span>Apply for Booth in Platform</span>
          </button>

          <button
            onClick={() => navigate("/my-applications/accepted")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-white/5"
          >
            <FileText size={18} />
            <span>View Applications</span>
          </button>

          <button
            onClick={() => navigate("/guc-loyalty-apply")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-white/5"
          >
            <Users size={20} />
            <span>Apply for GUC Loyalty Program</span>
          </button>
       
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
    </>
  );
}
