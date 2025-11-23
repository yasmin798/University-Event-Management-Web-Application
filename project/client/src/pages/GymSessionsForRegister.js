import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../events.theme.css";
import axios from "axios";
import Sidebar from "../components/Sidebar";

export default function GymManager() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [sessions, setSessions] = useState([]);

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

  // ------------------------
  // 🔵 WEEK NAVIGATION
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
    // 🔥 Get email using the same logic you provided
    let email = null;

    try {
      const raw =
        localStorage.getItem("user") || localStorage.getItem("currentUser");

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

    // 👉 Send request to backend
    await axios.post(
      "http://localhost:3001/api/gym/register",
      {
        sessionId,
        email, // 👈 send the extracted email
      }
    );

    alert("Registered successfully!");
    fetchSessions(); // refresh UI
  } catch (err) {
    console.error("Registration error:", err);
    alert(err.response?.data?.error || "Error registering");
  }
};



  

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
            style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer" }}
          >
            ❮
          </button>

          <h2 style={{ margin: 0 }}>
            {weekStart.toLocaleString("en-US", { month: "long", year: "numeric" })}
          </h2>

          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer" }}
          >
            ❯
          </button>
        </div>

        {/* TIMETABLE GRID */}
        <div style={{ overflowX: "auto", marginTop: "20px" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "white",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <thead>
              <tr style={{ background: "#e9f5ff" }}>
                <th style={{ padding: "6px", border: "1px solid #ddd" }}>Day</th>
                {timeSlots.map((t) => (
                  <th
                    key={t}
                    style={{ padding: "6px", border: "1px solid #ddd", fontWeight: "700" }}
                  >
                    {t}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {days.map((day) => (
                <tr key={day.iso}>
                  {/* Day */}
                  <td
                    style={{
                      padding: "6px",
                      border: "1px solid #ddd",
                      fontWeight: "700",
                      background: "#f7faff",
                    }}
                  >
                    {day.label}
                    <br />
                    <span style={{ fontSize: "14px", color: "#666" }}>{day.dateNum}</span>
                  </td>

                  {/* Sessions */}
                  {timeSlots.map((t) => {
                    const session = timetable[day.label][t];

                    return (
                      <td
                        key={t}
                        style={{
                          padding: "6px",
                          border: "1px solid #ddd",
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}
                      >
                                                {session ? (
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
                            Spots: {session.registeredUsers?.length || 0} / {session.maxParticipants}<br />
                            {/* NEW: Show restriction */}
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
                          </div>
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
