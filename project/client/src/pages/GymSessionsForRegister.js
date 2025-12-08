// client/src/pages/GymSessionsForRegister.js (updated with same-sized boxes)
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../events.theme.css";
import Sidebar from "../components/Sidebar";
import StudentSidebar from "../components/StudentSidebar";
import ProfessorSidebar from "../components/ProfessorSidebar";
import TaSidebar from "../components/TaSidebar";
import StaffSidebar from "../components/StaffSidebar";

export default function GymSessionsForRegister({ SidebarComponent = null }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [sessions, setSessions] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/gym");
        setSessions(res.data);
      } catch (err) {
        console.error("Error fetching sessions:", err);
      }
    })();
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const role = (payload.role || "").toLowerCase();
        setUserRole(role);
        setDebugInfo(`Role loaded: ${role}`);
        if (["events_office", "events-office", "eventsoffice"].includes(role)) {
          navigate("/gym-manager");
          return;
        }
      } catch (e) {
        console.error("Error decoding token for role:", e);
        setDebugInfo("Role load failed");
      }
    } else {
      setDebugInfo("No token found");
    }
  }, [navigate]);

  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff));
  });

  const formatDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  };
  const addDays = (date, days) => {
    const nd = new Date(date);
    nd.setDate(nd.getDate() + days);
    return nd;
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
    let email = null;
    try {
      const raw =
        localStorage.getItem("user") || localStorage.getItem("currentUser");
      if (raw) email = JSON.parse(raw)?.email;
    } catch {}
    if (!email) {
      alert("No email found. Please log in again.");
      return;
    }

    const session = sessions.find((s) => s._id === sessionId);
    if (!session) return alert("Session not found");
    const normalizedAllowedRoles = (session.allowedRoles || []).map((r) =>
      r.toLowerCase()
    );
    const isOpenToAll = normalizedAllowedRoles.length === 0;
    if (!isOpenToAll && !normalizedAllowedRoles.includes(userRole)) {
      const allowedDisplay = normalizedAllowedRoles
        .map((r) =>
          r === "ta" ? "TAs" : r.charAt(0).toUpperCase() + r.slice(1) + "s"
        )
        .join(", ");
      return alert(
        `This gym session is intended for ${allowedDisplay}! Your role: ${userRole}`
      );
    }

    try {
      const res = await axios.post("http://localhost:3000/api/gym/register", {
        sessionId,
        email,
      });
      alert(res.data.message || "Registered successfully!");
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
    const spotsLeft =
      session.maxParticipants - (session.registeredUsers?.length || 0);

    let currentUserEmail = null;
    try {
      const raw =
        localStorage.getItem("user") || localStorage.getItem("currentUser");
      if (raw) currentUserEmail = JSON.parse(raw)?.email;
    } catch {}
    const isRegistered = session.registeredUsers?.some(
      (user) => user.email === currentUserEmail
    );
    const canRegister =
      isOpenToAll || normalizedAllowedRoles.includes(userRole);

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

    const action = isRegistered ? (
      <button
        style={{
          marginTop: "8px",
          padding: "6px 14px",
          fontSize: "14px",
          borderRadius: "10px",
          background: "#9E9E9E",
          color: "white",
          border: "none",
          cursor: "not-allowed",
          width: "100%",
        }}
        disabled
      >
        Registered
      </button>
    ) : canRegister && spotsLeft > 0 ? (
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

    const malfunctioned = (session.machines || []).filter(
      (m) => m.status === "malfunctioned"
    );
    const note =
      malfunctioned.length > 0 ? (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: "#d32f2f",
            textAlign: "left",
          }}
        >
          Note: {malfunctioned.map((m) => `"${m.name}"`).join(", ")}{" "}
          {malfunctioned.length > 1 ? "are" : "is"} malfunctioned
        </div>
      ) : (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: "#2e7d32",
            textAlign: "left",
          }}
        >
          All machines are available
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
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          textAlign: "left",
          flex: 1,
        }}
      >
        <div>
          {session.type.toUpperCase()} <br />
          {session.duration} min <br />
          Spots: {spotsLeft > 0 ? spotsLeft : 0} / {session.maxParticipants}
          <br />
          {note}
          {restrictionText}
        </div>
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
    : userRole === "ta"
    ? TaSidebar
    : userRole === "staff"
    ? StaffSidebar
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
              background: "none",
              border: "none",
              fontSize: "22px",
              cursor: "pointer",
            }}
          >
            ❮
          </button>
          <h2 style={{ margin: 0 }}>
            {weekStart.toLocaleString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            style={{
              background: "none",
              border: "none",
              fontSize: "22px",
              cursor: "pointer",
            }}
          >
            ❯
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
                <th
                  style={{
                    padding: "12px",
                    textAlign: "center",
                    width: "80px",
                  }}
                >
                  Time
                </th>
                {days.map((day) => (
                  <th
                    key={day.iso}
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      width: "14.28%",
                    }}
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
                      height: "180px", // Fixed height
                      verticalAlign: "middle",
                      textAlign: "center",
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
                          height: "180px", // Fixed height
                          minHeight: "180px",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          {session ? (
                            renderSessionCell(session)
                          ) : (
                            <div
                              style={{
                                background: "#e0f7fa",
                                color: "#003f5c",
                                padding: "10px",
                                borderRadius: "8px",
                                fontWeight: 600,
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flex: 1,
                              }}
                            >
                              Free
                            </div>
                          )}
                        </div>
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
