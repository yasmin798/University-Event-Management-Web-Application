// client/src/pages/GymSessionsForRegister.js (updated with frontend role check and better error handling)
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../events.theme.css";
import axios from "axios";
import Sidebar from "../components/Sidebar";

export default function GymManager() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [sessions, setSessions] = useState([]);
  const [userRole, setUserRole] = useState(""); // ← NEW: User's role

  const fetchSessions = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/gym");
      setSessions(res.data);
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // ← NEW: Get user's role from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserRole(payload.role || ""); // Assume role is in token payload
      } catch (e) {
        console.error("Error decoding token for role");
      }
    }
  }, []);

  // ------------------------
  // 🔵 WEEK NAVIGATION (unchanged)
  // ------------------------
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff)); // Week start (Sunday)
  });

  function formatDate(d) {
    return d.toISOString().split("T")[0];
  }

  function addDays(date, days) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  }

  // Build 7-day week
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    return {
      label: d.toLocaleString("en-US", { weekday: "long" }),
      iso: formatDate(d),
      dateNum: d.getDate(),
    };
  });

  // Unique time slots
  const timeSlots = Array.from(
    new Set(sessions.map((s) => s.time.slice(0, 5)))
  ).sort();

  // Create timetable grid
  const timetable = {};
  days.forEach((d) => {
    timetable[d.label] = {};
    timeSlots.forEach((t) => (timetable[d.label][t] = null));
  });

  // Insert sessions
  sessions.forEach((s) => {
    const iso = s.date.split("T")[0];
    const time = s.time.slice(0, 5);
    const dayObj = days.find((d) => d.iso === iso);
    if (dayObj) timetable[dayObj.label][time] = s;
  });

  const registerSession = async (sessionId) => {
    try {
      // Get email from localStorage
      let email = null;
      try {
        const raw = localStorage.getItem("user") || localStorage.getItem("currentUser");
        if (raw) {
          const u = JSON.parse(raw);
          if (u && u.email) {
            email = u.email;
          }
        }
      } catch (e) {
        console.warn("Error reading email from localStorage");
      }

      if (!email) {
        alert("Could not find your email. Please log in again.");
        return;
      }

      // ← NEW: Frontend role check (for better UX; backend still enforces)
      const session = sessions.find(s => s._id === sessionId);
      const isOpenToAll = !session.allowedRoles || session.allowedRoles.length === 0;
      if (!isOpenToAll && !session.allowedRoles.includes(userRole)) {
        const allowed = session.allowedRoles.map(r => r === "ta" ? "TAs" : r + "s").join(", ");
        alert(`This gym session is intended for ${allowed}!`);
        return;
      }

      // Send request to backend
      await axios.post("http://localhost:3000/api/gym/register", { // ← Fixed port to match backend
        sessionId,
        email,
      });

      alert("Registered successfully!");
      fetchSessions(); // Refresh UI
    } catch (err) {
      console.error("Registration error:", err);
      // ← NEW: Show backend message (e.g., role restriction)
      alert(err.response?.data?.error || "Error registering");
    }
  };

  // ← UPDATED: Render logic with role-based button visibility
  const renderSessionCell = (session) => {
    const isOpenToAll = !session.allowedRoles || session.allowedRoles.length === 0;
    const canRegister = isOpenToAll || session.allowedRoles.includes(userRole);
    const spotsLeft = session.maxParticipants - (session.registeredUsers?.length || 0);

    return (
      <div
        style={{
          background: "#e0e0e0",
          color: "#333",
          padding: "10px",
          borderRadius: "8px",
          fontWeight: 600,
        }}
      >
        {session.type.toUpperCase()} <br />
        {session.duration} min<br />
        Max: {session.maxParticipants}<br />
        Spots: {spotsLeft > 0 ? spotsLeft : 0} / {session.maxParticipants}<br />
        {/* Restriction display (unchanged) */}
        {session.allowedRoles?.length > 0 ? (
          <div style={{ color: "#d32f2f", fontSize: "12px", fontWeight: "bold", marginTop: "4px" }}>
            Only for: {session.allowedRoles
              .map(r => r === "ta" ? "TAs" : r + "s")
              .join(", ")}
          </div>
        ) : (
          <div style={{ color: "#2e7d32", fontSize: "12px", marginTop: "4px" }}>
            Open to everyone
          </div>
        )}
        {/* ← UPDATED: Button only if eligible and spots available */}
        {canRegister && spotsLeft > 0 ? (
          <button
            onClick={() => registerSession(session._id)}
            style={{
              marginTop: "8px",
              padding: "6px 14px",
              fontSize: "14px",
              borderRadius: "10px",
              background: "#4CAF50",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Register
          </button>
        ) : spotsLeft === 0 ? (
          <div style={{ marginTop: "8px", fontSize: "12px", color: "#f44336" }}>Full</div>
        ) : (
          <div style={{ marginTop: "8px", fontSize: "12px", color: "#f44336" }}>Not eligible</div>
        )}
      </div>
    );
  };

  // Rest of the component (timetable rendering) – replace the session cell in the table:
  return (
    <div className="events-theme" style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar filter={filter} setFilter={setFilter} />

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, marginLeft: "260px", padding: "10px 24px" }}>
        <h1 style={{ marginTop: 0, color: "var(--navy)" }}>Weekly Gym Timetable</h1>

        {/* Month Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "8px",
            gap: "20px",
          }}
        >
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            style={{ padding: "8px 16px", background: "#6C63FF", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
          >
            ← Previous Week
          </button>
          <span style={{ fontSize: "18px", fontWeight: "600" }}>
            Week of {days[0].dateNum}–{days[6].dateNum}, {days[0].label.toUpperCase()}
          </span>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            style={{ padding: "8px 16px", background: "#6C63FF", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
          >
            Next Week →
          </button>
        </div>

        {/* Timetable Table */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "white",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <thead>
              <tr style={{ background: "#6C63FF", color: "white" }}>
                <th style={{ padding: "12px", textAlign: "left" }}>Time</th>
                {days.map((day) => (
                  <th key={day.iso} style={{ padding: "12px", textAlign: "center" }}>
                    {day.label}
                    <br />
                    <span style={{ fontSize: "14px" }}>{day.dateNum}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((t) => (
                <tr key={t}>
                  <td
                    style={{
                      padding: "12px",
                      background: "#f8f9fa",
                      fontWeight: "600",
                      borderRight: "2px solid #e9ecef",
                    }}
                  >
                    {t}
                  </td>
                  {days.map((day) => {
                    const session = timetable[day.label][t];

                    return (
                      <td
                        key={day.iso}
                        style={{
                          padding: "6px",
                          border: "1px solid #ddd",
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}
                      >
                        {session ? (
                          renderSessionCell(session) // ← Use the new render function
                        ) : (
                          <div
                            style={{
                              background: "#b6f4ff",
                              padding: "10px",
                              borderRadius: "8px",
                              color: "#003f5c",
                              fontWeight: 600,
                            }}
                          >
                            Free
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}