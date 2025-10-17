import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ⟵ add this
import "../events.theme.css";
import NavBar from "../components/NavBar";
import axios from "axios";

const sessionTypes = [
  "yoga",
  "pilates",
  "aerobics",
  "zumba",
  "cross circuit",
  "kick-boxing",
];

export default function GymManager() {
  const navigate = useNavigate(); // ⟵ add this
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({
    date: "",
    time: "",
    duration: "",
    type: "",
    maxParticipants: "",
  });

  const today = new Date().toISOString().split("T")[0];

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
      fetchSessions();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to create session");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this session?"))
      return;
    try {
      await axios.delete(`http://localhost:3000/api/gym/${id}`);
      alert("🗑️ Deleted successfully!");
      fetchSessions();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete");
    }
  };

  const gymSessions = [...sessions].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  return (
    <div className="events-theme gym-manager">
      <div className="container">
        <NavBar bleed />

        {/* Unified title + back row */}
        <div className="eo-head-row">
          <h1>Manage and organize all Gym sessions.</h1>
          <button
            type="button"
            className="btn btn-outline eo-back"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            Back
          </button>
        </div>

        <section className="eo-grid">
          <article className="card">
            <h2 style={{ margin: "0 0 16px" }}>Add a New Gym Session</h2>
            <form onSubmit={handleSubmit}>
              <div className="kv">
                <label className="k" htmlFor="date">
                  Date:
                </label>
                <input
                  id="date"
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  min={today}
                />
              </div>
              <div className="kv">
                <label className="k" htmlFor="time">
                  Time:
                </label>
                <input
                  id="time"
                  type="time"
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="kv">
                <label className="k" htmlFor="duration">
                  Duration (minutes):
                </label>
                <input
                  id="duration"
                  type="number"
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  required
                  min="1"
                />
              </div>
              <div className="kv">
                <label className="k" htmlFor="type">
                  Type:
                </label>
                <select
                  id="type"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Type</option>
                  {sessionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="kv">
                <label className="k" htmlFor="maxParticipants">
                  Max Participants:
                </label>
                <input
                  id="maxParticipants"
                  type="number"
                  name="maxParticipants"
                  value={form.maxParticipants}
                  onChange={handleChange}
                  required
                  min="1"
                />
              </div>
              <div className="actions">
                <button type="submit" className="btn">
                  Create Session
                </button>
              </div>
            </form>
          </article>
        </section>

        <h1 className="eo-section-title">All Sessions</h1>

        <div className="grid">
          {gymSessions.length === 0 && (
            <div className="empty">No sessions found.</div>
          )}
          {gymSessions.map((s) => (
            <article key={s._id} className="card">
              <div className="chip">{s.type}</div>
              <div className="kv kv-date">
                <span className="k">Date:</span>
                <span className="v">
                  {new Date(s.date).toLocaleDateString()}
                </span>
              </div>
              <div className="kv">
                <span className="k">Time:</span>
                <span className="v">{s.time}</span>
              </div>
              <div className="kv">
                <span className="k">Duration:</span>
                <span className="v">{s.duration} min</span>
              </div>
              <div className="kv">
                <span className="k">Max Participants:</span>
                <span className="v">{s.maxParticipants}</span>
              </div>
              <div className="actions">
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(s._id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
