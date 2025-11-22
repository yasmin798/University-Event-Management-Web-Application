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

  // ------------------------
  // DELETE
  // ------------------------
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    await axios.delete(`http://localhost:3000/api/gym/${id}`);
    fetchSessions();
  };

  // ------------------------
  // EDIT STATE
  // ------------------------
  const [editing, setEditing] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editDuration, setEditDuration] = useState("");

  const startEdit = (session) => {
    setEditing(session._id);
    setEditDate(session.date.split("T")[0]);
    setEditTime(session.time);
    setEditDuration(session.duration);
  };

  const saveEdit = async () => {
    await axios.put(`http://localhost:3000/api/gym/${editing}`, {
      date: editDate,
      time: editTime,
      duration: editDuration,
    });

    setEditing(null);
    fetchSessions();
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
                            {session.duration} min
                            <br />
                            Max: {session.maxParticipants}
                            <br />

                            {/* EDIT + DELETE */}
                            <div
                                style={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "center",
                                gap: "8px",
                                marginTop: "10px",
                                flexWrap: "wrap",
                              }}
                            >
                          <button
                              className="btn"
                              style={{
                              padding: "6px 14px",
                              fontSize: "14px",
                              borderRadius: "10px",
                            }}
                           onClick={() => startEdit(session)}
                            >
                          Edit
                       </button>

                       <button
                          className="btn-danger"
                           style={{
                           padding: "6px 14px",
                          fontSize: "14px",
                           borderRadius: "10px",
                            }}
                           onClick={() => handleDelete(session._id)}
                                >
                            Delete
                           </button>
                          </div>

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

        {/* ---------------------------- */}
        {/* EDIT POPUP MODAL */}
        {/* ---------------------------- */}
        {editing && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 999,
    }}
  >
    <div
      style={{
        background: "white",
        padding: "24px",
        borderRadius: "12px",
        width: "340px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "15px" }}>Edit Session</h3>

      <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>
        Date
      </label>
      <input
        type="date"
        value={editDate}
        onChange={(e) => setEditDate(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "6px",
          border: "1px solid #aaa",
          marginBottom: "12px",
          fontSize: "14px",
        }}
      />

      <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>
        Time
      </label>
      <input
        type="time"
        value={editTime}
        onChange={(e) => setEditTime(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "6px",
          border: "1px solid #aaa",
          marginBottom: "12px",
          fontSize: "14px",
        }}
      />

      <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>
        Duration (minutes)
      </label>
      <input
        type="number"
        value={editDuration}
        onChange={(e) => setEditDuration(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "6px",
          border: "1px solid #aaa",
          marginBottom: "16px",
          fontSize: "14px",
        }}
      />

      <button
        style={{
          background: "#6C63FF",
          padding: "10px",
          border: "none",
          color: "white",
          borderRadius: "6px",
          cursor: "pointer",
          width: "100%",
          marginBottom: "10px",
          fontWeight: "600",
        }}
        onClick={saveEdit}
      >
        Save
      </button>

      <button
        style={{
          background: "#ddd",
          padding: "10px",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          width: "100%",
          fontWeight: "600",
        }}
        onClick={() => setEditing(null)}
      >
        Cancel
      </button>
    </div>
  </div>
)}

      </main>
    </div>
  );
}
