import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../events.theme.css";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import StudentSidebar from "../components/StudentSidebar";
import ProfessorSidebar from "../components/ProfessorSidebar";
import GymSessionsForRegister from "./GymSessionsForRegister";
import TaSidebar from "../components/TaSidebar";
import StaffSidebar from "../components/StaffSidebar";

export default function GymManager() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [sessions, setSessions] = useState([]);
  const [userRole, setUserRole] = useState("student");

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserRole((payload.role || "student").toLowerCase());
      }
    } catch (e) {
      setUserRole("student");
    }
  }, []);

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
    // Return local YYYY-MM-DD to avoid UTC day shift
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
    const iso = formatDate(new Date(s.date));
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
  // Editing via modal removed; navigation is used instead

  // Default equipment list to prefill when a session lacks machines
  // Default equipment constant no longer needed here

  const startEdit = (session) => {
    // Navigate to the gym session creation form with this session's data
    navigate("/gym-manager", { state: { session } });
  };

  // saveEdit removed

  // updateEditMachineStatus removed

  // If professor, show the registration view (same as student) but with ProfessorSidebar
  if (userRole === "professor") {
    return <GymSessionsForRegister SidebarComponent={ProfessorSidebar} />;
  }
  if (userRole === "ta") {
    return <GymSessionsForRegister SidebarComponent={TaSidebar} />;
  }
  if (userRole === "staff") {
    return <GymSessionsForRegister SidebarComponent={StaffSidebar} />;
  }

  return (
    <div
      className="events-theme"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      {!userRole ? null : userRole === "student" ? (
        <StudentSidebar />
      ) : userRole === "professor" ? (
        <ProfessorSidebar />
      ) : userRole === "ta" ? (
        <TaSidebar />
      ) : userRole === "staff" ? (
        <StaffSidebar />
      ) : (
        <Sidebar filter={filter} setFilter={setFilter} />
      )}

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, marginLeft: "260px", padding: "10px 24px" }}>
        <h1 style={{ marginTop: 0, color: "var(--navy)" }}>
          Weekly Gym Timetable
        </h1>

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

        {/* TIMETABLE GRID (Time rows, Days columns) */}
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
                <th
                  style={{
                    padding: "6px",
                    border: "1px solid #ddd",
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
                      padding: "6px",
                      border: "1px solid #ddd",
                      fontWeight: "700",
                      textAlign: "center",
                      width: "14.28%", // Equal width for each day column
                    }}
                  >
                    {day.label}
                    <br />
                    <span style={{ fontSize: "14px", color: "#666" }}>
                      {day.dateNum}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((t) => (
                <tr key={t}>
                  <td
                    style={{
                      padding: "6px",
                      border: "1px solid #ddd",
                      fontWeight: "700",
                      background: "#f7faff",
                      height: "180px", // Fixed height for all cells
                      textAlign: "center",
                      verticalAlign: "middle",
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
                          height: "180px", // Fixed height for all cells
                          minHeight: "180px",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
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
                                {session.duration} min
                                <br />
                                Max: {session.maxParticipants}
                                <br />
                                {Array.isArray(session.machines) &&
                                session.machines.length > 0 ? (
                                  (() => {
                                    const malfunctioned =
                                      session.machines.filter(
                                        (m) => m.status === "malfunctioned"
                                      );
                                    if (malfunctioned.length > 0) {
                                      const names = malfunctioned
                                        .map((m) => `"${m.name}"`)
                                        .join(", ");
                                      return (
                                        <div
                                          style={{
                                            marginTop: 6,
                                            fontSize: 12,
                                            color: "#d32f2f",
                                          }}
                                        >
                                          Note: {names}{" "}
                                          {malfunctioned.length > 1
                                            ? "are"
                                            : "is"}{" "}
                                          malfunctioned
                                        </div>
                                      );
                                    }
                                    return (
                                      <div
                                        style={{
                                          marginTop: 6,
                                          fontSize: 12,
                                          color: "#2e7d32",
                                        }}
                                      >
                                        All machines are available
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <div
                                    style={{
                                      marginTop: 6,
                                      fontSize: 12,
                                      color: "#2e7d32",
                                    }}
                                  >
                                    All machines are available
                                  </div>
                                )}
                              </div>
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
                                background: "#e0f7fa",
                                padding: "10px",
                                borderRadius: "8px",
                                color: "#003f5c",
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

        {/* Edit pop-up removed; navigation is used instead */}
      </main>
    </div>
  );
}
