import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../events.theme.css";
import Sidebar from "../components/Sidebar";

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
  const [filter, setFilter] = useState("All");

  const [form, setForm] = useState({
    date: "",
    time: "",
    duration: "",
    type: "",
    maxParticipants: "",
    allowedRoles: [], // ← NEW: Role restrictions
  });

  const today = new Date().toISOString().split("T")[0];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setForm(prev => ({
        ...prev,
        allowedRoles: checked
          ? [...prev.allowedRoles, value]
          : prev.allowedRoles.filter(r => r !== value),
      }));
    } else {
      setForm({ ...form, [name]: value });
    }
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
      });
    } catch (err) {
      console.error(err);
      alert("Failed to create session");
    }
  };

  return (
    <div className="events-theme" style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar filter={filter} setFilter={setFilter} />

      <main
        style={{
          flex: 1,
          marginLeft: "260px",
          padding: "20px 40px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1 style={{ color: "var(--navy)", fontWeight: 800, marginBottom: "12px", textAlign: "center" }}>
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
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", marginBottom: "20px" }}>
            Add a New Gym Session
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Existing fields */}
            <div className="kv">
              <label className="k">Date:</label>
              <input type="date" name="date" value={form.date} onChange={handleChange} required min={today} />
            </div>

            <div className="kv">
              <label className="k">Time:</label>
              <input type="time" name="time" value={form.time} onChange={handleChange} required />
            </div>

            <div className="kv">
              <label className="k">Duration (minutes):</label>
              <input type="number" name="duration" value={form.duration} onChange={handleChange} required min="1" />
            </div>

            <div className="kv">
              <label className="k">Type:</label>
              <select name="type" value={form.type} onChange={handleChange} required>
                <option value="">Select Type</option>
                {sessionTypes.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="kv">
              <label className="k">Max Participants:</label>
              <input type="number" name="maxParticipants" value={form.maxParticipants} onChange={handleChange} required min="1" />
            </div>

            {/* ← NEW: Role Restrictions */}
            <div style={{ padding: "16px", background: "#f8f9fa", borderRadius: "12px", marginTop: "10px" }}>
              <label className="k" style={{ fontWeight: "bold", marginBottom: "10px", display: "block" }}>
                Who can register?
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                {["student", "professor", "ta", "staff"].map(role => (
                  <label key={role} style={{ display: "flex", alignItems: "center", fontSize: "15px" }}>
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
              <small style={{ color: "#666", marginTop: "8px", display: "block" }}>
                Leave all unchecked → Open to everyone
              </small>
            </div>

            <button type="submit" className="btn" style={{ marginTop: "10px", padding: "12px" }}>
              Create Session
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}