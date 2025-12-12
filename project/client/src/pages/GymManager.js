import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../events.theme.css";
import { Search, Mic } from "lucide-react";
import Sidebar from "../components/Sidebar";
import NotificationsDropdown from "../components/NotificationsDropdown";

const sessionTypes = [
  "yoga",
  "pilates",
  "aerobics",
  "zumba",
  "cross circuit",
  "kick-boxing",
];

export default function CreateGym() {
  const navigate = useNavigate();
  const location = useLocation();
  const [filter, setFilter] = useState("All");

  // Fixed equipment list shown with status dropdowns
  const defaultEquipment = [
    "Mats",
    "Music System",
    "Treadmill",
    "Elliptical",
    "Stationary Bike",
    "Rowing Machine",
    "Leg Press",
    "Bench Press",
    "Squat Rack",
    "Pull-up Bar",
    "Cable Machine",
    "Dumbbells",
    "Kettlebells",
  ];

  const [form, setForm] = useState({
    date: "",
    time: "",
    duration: "",
    type: "",
    maxParticipants: "",
    allowedRoles: [], // ← NEW: Role restrictions
    machines: defaultEquipment.map((name) => ({ name, status: "available" })), // Fixed list with statuses
  });

  // If navigated with a session to edit, prefill the form
  React.useEffect(() => {
    const session = location.state?.session;
    if (session) {
      setForm((prev) => ({
        ...prev,
        date: session.date ? session.date.split("T")[0] : prev.date,
        time: session.time || prev.time,
        duration: session.duration || prev.duration,
        type: session.type || prev.type,
        maxParticipants: session.maxParticipants || prev.maxParticipants,
        allowedRoles: Array.isArray(session.allowedRoles)
          ? session.allowedRoles
          : prev.allowedRoles,
        machines:
          Array.isArray(session.machines) && session.machines.length > 0
            ? session.machines
            : prev.machines,
      }));
    }
  }, [location.state]);

  const today = new Date().toISOString().split("T")[0];

  // Common input styling for clearer affordance
  const inputStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #cfd8dc",
    background: "#f9fbfc",
    fontSize: "14px",
  };
  // Collapsible section for machines status
  const [machinesOpen, setMachinesOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        allowedRoles: checked
          ? [...prev.allowedRoles, value]
          : prev.allowedRoles.filter((r) => r !== value),
      }));
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const toggleMachineStatus = (idx, status) => {
    setForm((prev) => ({
      ...prev,
      machines: prev.machines.map((m, i) => (i === idx ? { ...m, status } : m)),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (parseInt(form.maxParticipants) < 1) {
      alert("Max participants must be at least 1");
      return;
    }
    if (new Date(form.date) < new Date(today)) {
      alert("Date cannot be in the past");
      return;
    }

    try {
      await axios.post("http://localhost:3000/api/gym", form); // ← allowedRoles is now sent
      alert("Session created successfully!");

      setForm({
        date: "",
        time: "",
        duration: "",
        type: "",
        maxParticipants: "",
        allowedRoles: [],
        machines: defaultEquipment.map((name) => ({
          name,
          status: "available",
        })),
      });
    } catch (err) {
      console.error(err);
      alert("Failed to create session");
    }
  };

  return (
    <div
      className="events-theme"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      <Sidebar filter={filter} setFilter={setFilter} />

      <main
        style={{
          flex: 1,
          marginLeft: "260px",
          padding: "0 24px 24px",
          display: "flex",
          flexDirection: "column",
        }}
      >
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
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "16px",
            }}
          >
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
            </div>
          </div>
        </header>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <h1
            style={{
              color: "var(--navy)",
              fontWeight: 800,
              marginBottom: "12px",
              textAlign: "center",
            }}
          >
            Create a New Gym Session
          </h1>

          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "560px",
              padding: "32px",
              borderRadius: "18px",
              boxShadow: "var(--shadow)",
              background: "white",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: "700",
                marginBottom: "20px",
              }}
            >
              Add a New Gym Session
            </h2>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "18px" }}
            >
              {/* Existing fields */}
              <div className="kv">
                <label className="k">Date:</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  min={today}
                  style={inputStyle}
                />
              </div>

              <div className="kv">
                <label className="k">Time:</label>
                <input
                  type="time"
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>

              <div className="kv">
                <label className="k">Duration (minutes):</label>
                <input
                  type="number"
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  required
                  min="1"
                  style={inputStyle}
                />
              </div>

              <div className="kv">
                <label className="k">Type:</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                >
                  <option value="">Select Type</option>
                  {sessionTypes.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="kv">
                <label className="k">Max Participants:</label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={form.maxParticipants}
                  onChange={handleChange}
                  required
                  min="1"
                  style={inputStyle}
                />
              </div>

              {/* ← NEW: Role Restrictions */}
              <div
                style={{
                  padding: "16px",
                  background: "#f8f9fa",
                  borderRadius: "12px",
                  marginTop: "10px",
                }}
              >
                <label
                  className="k"
                  style={{
                    fontWeight: "bold",
                    marginBottom: "10px",
                    display: "block",
                  }}
                >
                  Who can register?
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                  {["student", "professor", "ta", "staff"].map((role) => (
                    <label
                      key={role}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        fontSize: "15px",
                      }}
                    >
                      <input
                        type="checkbox"
                        value={role}
                        checked={form.allowedRoles.includes(role)}
                        onChange={handleChange}
                        style={{ marginRight: "8px" }}
                      />
                      <span style={{ textTransform: "capitalize" }}>
                        {role === "ta" ? "TAs" : role + "s"}
                      </span>
                    </label>
                  ))}
                </div>
                <small
                  style={{ color: "#666", marginTop: "8px", display: "block" }}
                >
                  Leave all unchecked → Open to everyone
                </small>
              </div>

              {/* Machines status: fixed equipment with dropdowns (collapsible) */}
              <div style={{ background: "#f1f8e9", borderRadius: "12px" }}>
                <button
                  type="button"
                  onClick={() => setMachinesOpen(!machinesOpen)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    textAlign: "left",
                    padding: "14px 16px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Gym Machines Status</span>
                  <span>{machinesOpen ? "▾" : "▸"}</span>
                </button>

                {machinesOpen && (
                  <div style={{ padding: "0 16px 16px" }}>
                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                        display: "grid",
                        gap: "8px",
                      }}
                    >
                      {form.machines.map((m, idx) => (
                        <li
                          key={idx}
                          style={{
                            background: "#fff",
                            border: "1px solid #ddd",
                            borderRadius: 8,
                            padding: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "8px",
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{m.name}</span>
                          <select
                            value={m.status}
                            onChange={(e) =>
                              toggleMachineStatus(idx, e.target.value)
                            }
                            style={{ ...inputStyle, width: "auto" }}
                          >
                            <option value="available">Available</option>
                            <option value="malfunctioned">Malfunctioned</option>
                          </select>
                        </li>
                      ))}
                    </ul>
                    <small
                      style={{
                        color: "#666",
                        marginTop: "8px",
                        display: "block",
                      }}
                    >
                      Appears in session details; no optional notes.
                    </small>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn"
                style={{ marginTop: "10px", padding: "12px" }}
              >
                Create Session
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
