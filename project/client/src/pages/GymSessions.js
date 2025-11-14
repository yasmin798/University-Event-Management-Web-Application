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
    const day = today.getDay(); // 0=Sunday
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff)); // Week start (Sun)
  });

  function formatDate(d) {
    return d.toISOString().split("T")[0];
  }

  function addDays(date, days) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  }

  // ------------------------
  // 🔵 Build 7-day visible week
  // ------------------------
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    return {
      label: d.toLocaleString("en-US", { weekday: "long" }),
      iso: formatDate(d),
      dateNum: d.getDate(),
    };
  });

  // ------------------------
  // 🔵 Extract unique time slots
  // ------------------------
  const timeSlots = Array.from(
    new Set(sessions.map((s) => s.time.slice(0, 5)))
  ).sort();

  // ------------------------
  // 🔵 Build timetable structure
  // ------------------------
  const timetable = {};
  days.forEach((d) => {
    timetable[d.label] = {}; // FIXED
    timeSlots.forEach((t) => {
      timetable[d.label][t] = null; // FIXED
    });
  });

  // ------------------------
  // 🔵 Insert sessions into table
  // ------------------------
  sessions.forEach((s) => {
    const iso = s.date.split("T")[0];
    const time = s.time.slice(0, 5);

    const dayObj = days.find((d) => d.iso === iso);

    if (dayObj) {
      timetable[dayObj.label][time] = s; // FIXED
    }
  });

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    await axios.delete(`http://localhost:3000/api/gym/${id}`);
    fetchSessions();
  };

  return (
    <div
      className="events-theme"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      <Sidebar filter={filter} setFilter={setFilter} />

      {/* ===================== MAIN CONTENT ===================== */}
      <main style={{ flex: 1, marginLeft: "260px", padding: "10px 24px" }}>
        <h1 style={{ marginTop: 0, color: "var(--navy)" }}>
          Weekly Gym Timetable
        </h1>

        {/* 🔵 Month Header */}
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

        {/* ===================== TIMETABLE GRID ===================== */}
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
            {/* HEADER ROW */}
            <thead>
              <tr style={{ background: "#e9f5ff" }}>
                <th style={{ padding: "6px", border: "1px solid #ddd" }}>
                  Day
                </th>

                {timeSlots.map((t) => (
                  <th
                    key={t}
                    style={{
                      padding: "6px",
                      border: "1px solid #ddd",
                      fontWeight: "700",
                    }}
                  >
                    {t}
                  </th>
                ))}
              </tr>
            </thead>

            {/* BODY ROWS */}
            <tbody>
              {days.map((day) => (
                <tr key={day.iso}>
                  {/* Day + Date */}
                  <td
                    style={{
                      padding: "6px",
                      border: "1px solid #ddd",
                      fontWeight: "700",
                      background: "#f7faff",
                    }}
                  >
                    {day.label} <br />
                    <span style={{ fontSize: "14px", color: "#666" }}>
                      {day.dateNum}
                    </span>
                  </td>

                  {/* Timeslots */}
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
                              background: "#6C63FF",
                              color: "white",
                              padding: "10px",
                              borderRadius: "8px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            {session.type.toUpperCase()} <br />
                            {session.duration} min
                            <br />
                            Max: {session.maxParticipants}
                            <br />
                            <button
                              className="btn-danger"
                              style={{
                                marginTop: "8px",
                                padding: "4px 10px",
                                fontSize: "12px",
                              }}
                              onClick={() => handleDelete(session._id)}
                            >
                              Delete
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
