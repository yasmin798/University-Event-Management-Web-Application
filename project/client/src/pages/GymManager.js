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

  // ⭐ FILTER STATE — only ONCE ⭐
  const [filter, setFilter] = useState("All");

  const [form, setForm] = useState({
    date: "",
    time: "",
    duration: "",
    type: "",
    maxParticipants: "",
  });

  const today = new Date().toISOString().split("T")[0];

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (parseInt(form.maxParticipants) < 1) {
      alert("❌ Max participants must be at least 1");
      return;
    }
    if (new Date(form.date) < new Date(today)) {
      alert("❌ Date cannot be in the past");
      return;
    }

    try {
      await axios.post("http://localhost:3000/api/gym", form);
      alert("✅ Session created successfully!");

      setForm({
        date: "",
        time: "",
        duration: "",
        type: "",
        maxParticipants: "",
      });
    } catch (err) {
      console.error(err);
      alert("❌ Failed to create session");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) navigate("/");
  };

  return (
    <div
      className="events-theme"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      {/* ==================== FIXED SIDEBAR ==================== */}
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
        <h1
          style={{
            color: "var(--navy)",
            fontWeight: 800,
            marginBottom: "12px",
            width: "100%",
            textAlign: "center",
          }}
        >
          Create a New Gym Session
        </h1>

        <div
          className="card"
          style={{
            width: "100%",
            maxWidth: "520px",
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            borderRadius: "18px",
            boxShadow: "var(--shadow)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>
            Add a New Gym Session
          </h2>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* DATE */}
            <div
              className="kv"
              style={{ display: "flex", flexDirection: "column" }}
            >
              <label className="k" style={{ marginBottom: "6px" }}>
                Date:
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                min={today}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            {/* TIME */}
            <div
              className="kv"
              style={{ display: "flex", flexDirection: "column" }}
            >
              <label className="k" style={{ marginBottom: "6px" }}>
                Time:
              </label>
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                required
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            {/* DURATION */}
            <div
              className="kv"
              style={{ display: "flex", flexDirection: "column" }}
            >
              <label className="k" style={{ marginBottom: "6px" }}>
                Duration (minutes):
              </label>
              <input
                type="number"
                name="duration"
                value={form.duration}
                onChange={handleChange}
                required
                min="1"
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            {/* TYPE */}
            <div
              className="kv"
              style={{ display: "flex", flexDirection: "column" }}
            >
              <label className="k" style={{ marginBottom: "6px" }}>
                Type:
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                required
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="">Select Type</option>
                {sessionTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* MAX PARTICIPANTS */}
            <div
              className="kv"
              style={{ display: "flex", flexDirection: "column" }}
            >
              <label className="k" style={{ marginBottom: "6px" }}>
                Max Participants:
              </label>
              <input
                type="number"
                name="maxParticipants"
                value={form.maxParticipants}
                onChange={handleChange}
                required
                min="1"
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            <button type="submit" className="btn" style={{ marginTop: "10px" }}>
              Create Session
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
