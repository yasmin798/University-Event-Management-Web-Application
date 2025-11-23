// client/src/components/AdminSidebar.js
import React from "react";
import { LogOut } from "lucide-react";
import NotificationsDropdown from "./NotificationsDropdown";
import { useNavigate } from "react-router-dom";

export default function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      navigate("/");
    }
  };

  return (
    <aside
      style={{
        width: "260px",
        height: "100vh",
        background: "var(--navy)",
        color: "white",
        position: "fixed",
        top: 0,
        left: 0,
        display: "flex",
        flexDirection: "column",
        padding: "20px",
        boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
        zIndex: 100,
      }}
    >
      <h2
        style={{
          marginBottom: "30px",
          fontSize: "22px",
          fontWeight: 800,
        }}
      >
        Admin Panel
      </h2>

      {/* Notifications bell for admin (shows unread count and dropdown) */}
      <div style={{ marginBottom: 18 }}>
        <NotificationsDropdown />
      </div>

      <div style={{ flex: 1 }} />

      <button
        onClick={handleLogout}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "#c88585",
          padding: "10px 16px",
          borderRadius: "10px",
          color: "white",
          fontWeight: 600,
          cursor: "pointer",
          border: "none",
        }}
      >
        <LogOut size={18} /> Logout
      </button>
    </aside>
  );
}
