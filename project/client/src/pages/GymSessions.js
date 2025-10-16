import React, { useEffect, useState } from "react";
import "../events.theme.css";
import NavBar from "../components/NavBar";

const GymSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/gym")
      .then((res) => res.json())
      .then((data) => {
        setSessions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching gym sessions:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="events-theme gym-loading">
        <div className="container">
          <NavBar bleed />
          <header className="eo-pagehead-simple">
            <h1>Manage and organize all Gym sessions.</h1>
          </header>
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <div className="loading-spinner">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  const gymSessions = [...sessions].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  return (
    <div className="events-theme gym-home">
      <div className="container">
        <NavBar bleed />
        <header className="eo-pagehead-simple">
          <h1>Manage and organize all Gym sessions.</h1>
        </header>

        <h2 style={{ margin: "24px 0 12px" }}>All Sessions</h2>
        <div className="grid">
          {gymSessions.length === 0 && (
            <div className="empty">No gym sessions found.</div>
          )}

          {gymSessions.map((s) => (
            <article key={s._id} className="card">
              <div className="chip">{s.type.toUpperCase()}</div>
              <div className="kv kv-date">
                <span className="k">Date:</span>
                <span className="v">{new Date(s.date).toLocaleDateString()}</span>
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
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GymSessions;