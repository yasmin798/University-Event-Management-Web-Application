import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

export default function ReserveCourt() {
  const { courtId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { date, time } = location.state || {};

  const [studentName, setStudentName] = useState(""); // input
  const [studentId, setStudentId] = useState("");     // input

  if (!date || !time) {
    return <h2 style={{ padding: 20 }}>Invalid reservation data.</h2>;
  }

  const handleConfirm = async () => {
    if (!studentName || !studentId) {
      alert("Please enter your name and GUC ID.");
      return;
    }

    const gucIdPattern = /^\d{2}-\d{4}$/;
    if (!gucIdPattern.test(studentId)) {
      alert("GUC ID must be in the format XX-XXXX.");
      return;
    }

    const reservation = { courtName: courtId, date, time, studentName, studentId };

    try {
      const res = await fetch("http://localhost:3000/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservation),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Reservation failed.");
        return;
      }

      alert("Reservation Confirmed!");
      navigate("/student/dashboard");
    } catch (error) {
      console.error(error);
      alert("Error connecting to server.");
    }
  };

  return (
    <div style={{ padding: "30px", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "20px" }}>Confirm Reservation</h1>
      <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "10px", background: "white" }}>
        <p><strong>Court:</strong> {courtId.toUpperCase()}</p>
        <p><strong>Date:</strong> {date}</p>
        <p><strong>Time:</strong> {time}</p>

        <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
          <label>
            Student Name:
            <input
              type="text"
              placeholder="First Last or First Middle Last"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc", marginTop: "5px" }}
            />
          </label>

          <label>
            GUC ID:
            <input
              type="text"
              placeholder="XX-XXXX"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc", marginTop: "5px" }}
            />
          </label>
        </div>

        <button
          onClick={handleConfirm}
          style={{
            marginTop: "25px",
            padding: "12px 20px",
            background: "#2563EB",
            border: "none",
            borderRadius: "8px",
            color: "white",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Confirm Reservation
        </button>
      </div>
    </div>
  );
}
