import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../events.theme.css";
import axios from "axios";
import { Search, Mic, Plus } from "lucide-react";
import Sidebar from "../components/Sidebar";
import StudentSidebar from "../components/StudentSidebar";
import ProfessorSidebar from "../components/ProfessorSidebar";
import GymSessionsForRegister from "./GymSessionsForRegister";
import TaSidebar from "../components/TaSidebar";
import StaffSidebar from "../components/StaffSidebar";
import NotificationsDropdown from "../components/NotificationsDropdown";

export default function GymManager() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [sessions, setSessions] = useState([]);
  const [userRole, setUserRole] = useState("student");
  const [searchTerm, setSearchTerm] = useState("");

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

  // Build 7-day week but omit Friday (weekday index 5)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    if (d.getDay() === 5) return null; // Skip Friday
    return {
      label: d.toLocaleString("en-US", { weekday: "long" }),
      iso: formatDate(d),
      dateNum: d.getDate(),
    };
  }).filter(Boolean);

  // Filter sessions based on search term
  const filteredSessions = sessions.filter((s) => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (s.type && s.type.toLowerCase().includes(searchLower)) ||
      (s.instructor && s.instructor.toLowerCase().includes(searchLower)) ||
      (s.equipment && s.equipment.toLowerCase().includes(searchLower)) ||
      (s.location && s.location.toLowerCase().includes(searchLower))
    );
  });

  // Unique time slots from filtered sessions
  const timeSlots = Array.from(
    new Set(filteredSessions.map((s) => s.time.slice(0, 5)))
  ).sort();

  // Create timetable grid
  const timetable = {};
  days.forEach((d) => {
    timetable[d.label] = {};
    timeSlots.forEach((t) => (timetable[d.label][t] = null));
  });

  // Insert filtered sessions
  filteredSessions.forEach((s) => {
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
      <main style={{ flex: 1, marginLeft: "260px", padding: "0 24px 24px" }}>
        {/* ==================== TOP HEADER PANEL ==================== */}
        <header
          style={{
            marginLeft: "-24px",
            marginRight: "-24px",
            width: "calc(100% + 48px)",
            background: "var(--card)",
            borderRadius: "0 0 16px 16px",
            boxShadow: "var(--shadow)",
            padding: "20px 24px",
            marginBottom: "20px",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          {/* Top Row: Search and Action Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              gap: "16px",
            }}
          >
            {/* LEFT: Search Bar - Stretched */}
            <div
              style={{
                position: "relative",
                flex: "1 1 auto",
                minWidth: "400px",
              }}
            >
              <Search
                size={18}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "14px",
                  transform: "translateY(-50%)",
                  color: "var(--teal)",
                }}
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 44px",
                  borderRadius: "10px",
                  border: "1px solid #e0e0e0",
                  fontSize: "14px",
                  background: "#f9fafb",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#567c8d";
                  e.target.style.background = "white";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e0e0e0";
                  e.target.style.background = "#f9fafb";
                }}
              />
            </div>

            {/* RIGHT: Action Buttons */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                flex: "0 0 auto",
              }}
            >
              <NotificationsDropdown />

              <button
                onClick={() => {
                  // Voice command can be implemented later
                  console.log("Voice command clicked");
                }}
                style={{
                  background: "#567c8d",
                  color: "white",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.background = "#45687a")}
                onMouseLeave={(e) => (e.target.style.background = "#567c8d")}
              >
                <Mic size={18} />
                Voice Command
              </button>

              {userRole === "admin" || userRole === "events_office" ? (
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => navigate("/gym-manager")}
                    style={{
                      padding: "10px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      borderRadius: "10px",
                      fontSize: "14px",
                      fontWeight: "600",
                      background: "#567c8d",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.target.style.background = "#45687a")}
                    onMouseLeave={(e) => (e.target.style.background = "#567c8d")}
                  >
                    <Plus size={18} />
                    Create Session
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {/* Title */}
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
