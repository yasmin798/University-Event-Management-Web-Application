// client/src/pages/GymSessionsForRegister.js (corrected with role normalization, better debugging, and ensured enforcement)
import React, { useEffect, useState } from "react";

import "../events.theme.css";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import StudentSidebar from "../components/StudentSidebar";
import ProfessorSidebar from "../components/ProfessorSidebar";

// Accept an optional SidebarComponent prop so other pages (professor)
// can reuse the registration UI but render a different sidebar.
export default function GymManager({ SidebarComponent = null }) {
  const [filter, setFilter] = useState("All");
  const [sessions, setSessions] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [debugInfo, setDebugInfo] = useState(""); // Temporary for debugging

  const fetchSessions = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/gym");
      setSessions(res.data);
      console.log(
        "Fetched sessions:",
        res.data.map((s) => ({ id: s._id, allowedRoles: s.allowedRoles }))
      );
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Get user's role from token (normalize to lowercase)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const role = (payload.role || "").toLowerCase();
        setUserRole(role);
        setDebugInfo(`Role loaded: ${role}`); // Debug
        console.log("User role:", role);
      } catch (e) {
        console.error("Error decoding token for role:", e);
        setDebugInfo("Role load failed");
      }
    } else {
      setDebugInfo("No token found");
      console.warn("No token in localStorage");
    }
  }, []);

  // Week navigation
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff));
  });

  const formatDate = (d) => d.toISOString().split("T")[0];

  const addDays = (date, days) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  };

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    return {
      label: d.toLocaleString("en-US", { weekday: "long" }),
      iso: formatDate(d),
      dateNum: d.getDate(),
    };
  });

  const timeSlots = Array.from(
    new Set(sessions.map((s) => s.time?.slice(0, 5) || ""))
  ).sort();

  const timetable = {};
  days.forEach((d) => {
    timetable[d.label] = {};
    timeSlots.forEach((t) => (timetable[d.label][t] = null));
  });

  sessions.forEach((s) => {
    const iso = formatDate(new Date(s.date));
    const time = s.time?.slice(0, 5) || "";
    const dayObj = days.find((d) => d.iso === iso);
    if (dayObj) timetable[dayObj.label][time] = s;
  });

  const registerSession = async (sessionId) => {
    console.log(
      "Register attempt for session:",
      sessionId,
      "User role:",
      userRole
    );
    // Get email
    let email = null;
    try {
      const raw =
        localStorage.getItem("user") || localStorage.getItem("currentUser");
      if (raw) {
        const u = JSON.parse(raw);
        email = u?.email;
        console.log("Email from storage:", email);
      }
    } catch (e) {
      console.warn("Error reading email from localStorage:", e);
    }

    if (!email) {
      alert("No email found. Please log in again.");
      return;
    }

    // Frontend role check (normalize roles to lowercase)
    const session = sessions.find((s) => s._id === sessionId);
    if (!session) {
      alert("Session not found");
      return;
    }
    const normalizedAllowedRoles = (session.allowedRoles || []).map((r) =>
      r.toLowerCase()
    );
    const isOpenToAll = normalizedAllowedRoles.length === 0;
    console.log(
      "Session allowedRoles (normalized):",
      normalizedAllowedRoles,
      "User role:",
      userRole
    );
    if (!isOpenToAll && !normalizedAllowedRoles.includes(userRole)) {
      const allowedDisplay = normalizedAllowedRoles
        .map((r) => {
          if (r === "ta") return "TAs";
          return r.charAt(0).toUpperCase() + r.slice(1) + "s";
        })
        .join(", ");
      alert(
        `This gym session is intended for ${allowedDisplay}! Your role: ${userRole}`
      );
      return;
    }

    // Backend call
    try {
      const res = await axios.post("http://localhost:3000/api/gym/register", {
        sessionId,
        email,
      });
      alert(res.data.message || "Registered successfully!");
      fetchSessions();
    } catch (err) {
      console.error("Registration error:", err.response?.data || err);
      alert(err.response?.data?.error || "Error registering. Check console.");
    }
  };

  const renderSessionCell = (session) => {
    const normalizedAllowedRoles = (session.allowedRoles || []).map((r) =>
      r.toLowerCase()
    );
    const isOpenToAll = normalizedAllowedRoles.length === 0;
    const canRegister =
      isOpenToAll || normalizedAllowedRoles.includes(userRole);
    const spotsLeft =
      session.maxParticipants - (session.registeredUsers?.length || 0);

    const restrictionText = isOpenToAll ? (
      <div style={{ color: "#2e7d32", fontSize: "12px", marginTop: "4px" }}>
        Open to everyone
      </div>
    ) : (
      <div
        style={{
          color: "#d32f2f",
          fontSize: "12px",
          fontWeight: "bold",
          marginTop: "4px",
        }}
      >
        Only for:{" "}
        {normalizedAllowedRoles
          .map((r) =>
            r === "ta" ? "TAs" : r.charAt(0).toUpperCase() + r.slice(1) + "s"
          )
          .join(", ")}
      </div>
    );

    const action =
      canRegister && spotsLeft > 0 ? (
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
            width: "100%",
          }}
        >
          Register
        </button>
      ) : spotsLeft <= 0 ? (
        <div style={{ marginTop: "8px", fontSize: "12px", color: "#f44336" }}>
          Full
        </div>
      ) : (
        <div style={{ marginTop: "8px", fontSize: "12px", color: "#f44336" }}>
          Not eligible (role: {userRole})
        </div>
      );

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
        {session.duration} min <br />
        Spots: {spotsLeft > 0 ? spotsLeft : 0} / {session.maxParticipants}{" "}
        <br />
        {restrictionText}
        {action}
      </div>
    );
  };

  const SidebarToRender = SidebarComponent
    ? SidebarComponent
    : userRole === "professor"
    ? ProfessorSidebar
    : userRole === "student"
    ? StudentSidebar
    : Sidebar;

  return (
    <div
      className="events-theme"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      <SidebarToRender filter={filter} setFilter={setFilter} />
      <main style={{ flex: 1, marginLeft: "260px", padding: "10px 24px" }}>
        <h1 style={{ marginTop: 0, color: "var(--navy)" }}>
          Weekly Gym Timetable
        </h1>
        {/* Debug info - remove after testing */}
        <p style={{ fontSize: "12px", color: "#666" }}>{debugInfo}</p>

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
            style={{
              padding: "8px 16px",
              background: "#6C63FF",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            ← Previous Week
          </button>
          <span style={{ fontSize: "18px", fontWeight: "600" }}>
            Week of {days[0].dateNum}–{days[6].dateNum},{" "}
            {days[0].label.toUpperCase()}
          </span>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            style={{
              padding: "8px 16px",
              background: "#6C63FF",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Next Week →
          </button>
        </div>

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
                  <th
                    key={day.iso}
                    style={{ padding: "12px", textAlign: "center" }}
                  >
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
                          renderSessionCell(session)
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
