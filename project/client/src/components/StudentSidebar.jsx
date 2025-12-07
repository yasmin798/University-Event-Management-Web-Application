// client/src/components/StudentSidebar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Heart,
  Map,
  CheckCircle,
  User,
  LogOut,
  Users,
  Dumbbell,
  Store,
  Home,
} from "lucide-react";
import EventityLogo from "./EventityLogo";

export default function StudentSidebar() {
  const navigate = useNavigate();

  const navBtn = (label, icon, onClick) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm 
                 hover:bg-white/5 text-white"
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-[#2f4156] text-white shadow-lg flex flex-col z-50">
      {/* LOGO */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div style={{ marginTop: "8px" }}>
            <EventityLogo size={35} showText={false} />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 800 }}>Student</h2>
        </div>
      </div>

      {/* MENU */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navBtn("Home", <Home size={18} />, () =>
          navigate("/student/dashboard")
        )}

        {navBtn("Registered Events", <Calendar size={18} />, () =>
          navigate("/events/registered")
        )}

        {navBtn("Favorites", <Heart size={18} />, () => navigate("/favorites"))}

        {navBtn("Courts Availability", <Map size={18} />, () =>
          navigate("/courts-availability")
        )}

        {navBtn("Gym Sessions", <Dumbbell size={18} />, () =>
          navigate("/gym-sessions-register")
        )}

        {navBtn("Polls Voting", <CheckCircle size={18} />, () =>
          navigate("/poll-voting")
        )}

        {navBtn("Loyalty Partners", <Store size={18} />, () =>
          navigate("/student/loyalty-vendors")
        )}

         {/* 👇 New Suggestions button */}
       {navBtn("Suggestions", <Users size={18} />, () =>
          navigate("/suggestions")
        )}


        {navBtn("Wallet", <User size={18} />, () => navigate("/wallet"))}
      </nav>

      {/* LOGOUT */}
      <div className="px-3 pb-6 pt-4 border-t border-white/10 mt-auto">
        <button
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/");
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/20"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
