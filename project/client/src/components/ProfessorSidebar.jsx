import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Calendar,
  Users,
  FileText,
  Heart,
  LogOut,
  CheckCircle,
} from "lucide-react";

export default function ProfessorSidebar() {
  const navigate = useNavigate();

  const navBtn = (label, icon, onClick) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-white/5 text-white"
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-[#2f4156] text-white shadow-lg flex flex-col z-50">
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-500" />
          <h2 style={{ fontSize: "22px", fontWeight: 800 }}>Professor</h2>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navBtn("Dashboard", <Menu size={18} />, () =>
          navigate("/professor/dashboard")
        )}

        {navBtn("Workshops", <Calendar size={18} />, () =>
          navigate("/professor/workshops")
        )}

        {navBtn("Registered Events", <Users size={18} />, () =>
          navigate("/events/registered")
        )}

        {navBtn("Favorites", <Heart size={18} />, () => navigate("/favorites"))}

        {navBtn("Polls Voting", <CheckCircle size={18} />, () =>
          navigate("/poll-voting")
        )}

        {navBtn("Create Workshop", <FileText size={18} />, () =>
          navigate("/professor/workshops/create")
        )}
      </nav>

      <div className="px-3 pb-6 pt-4 border-t border-white/10 mt-auto">
        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/20"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
