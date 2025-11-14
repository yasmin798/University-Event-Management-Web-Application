import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../events.theme.css";

export default function ChooseEventType() {
  const navigate = useNavigate();
  const [type, setType] = useState("");

  const handleNext = () => {
    if (!type) {
      alert("Please select an event type.");
      return;
    }

    if (type === "bazaar") navigate("/bazaars/create");
    if (type === "conference") navigate("/conferences/create");
    if (type === "trip") navigate("/trips/create");
  };

  return (
    <div
      className="events-theme"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <div
        className="card"
        style={{
          width: "380px",
          padding: "28px",
          borderRadius: "16px",
          boxShadow: "var(--shadow)",
          textAlign: "center",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>Select Event Type</h2>

        {/* DROPDOWN */}
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #ccc",
            marginBottom: "20px",
          }}
        >
          <option value="">-- Choose Type --</option>
          <option value="bazaar">Bazaar</option>
          <option value="conference">Conference</option>
          <option value="trip">Trip</option>
        </select>

        {/* NEXT BUTTON */}
        <button className="btn" style={{ width: "100%" }} onClick={handleNext}>
          Next
        </button>
      </div>
    </div>
  );
}
