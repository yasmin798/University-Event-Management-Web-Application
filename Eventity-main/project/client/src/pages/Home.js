import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div
      style={{
        textAlign: "center",
        paddingTop: "100px",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f4f4f4",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ color: "#333", fontSize: "2.5rem", marginBottom: "10px" }}>
        Welcome to <span style={{ color: "#007bff" }}>Eventity!</span>
      </h1>

      <p
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          color: "#555",
          fontSize: "1.1rem",
          lineHeight: "1.6",
        }}
      >
        <strong>Eventity</strong> is your university’s central hub for event
        management — where students and organizers come together to plan, manage,
        and participate in exciting campus activities. Whether it’s a bazaar, trip,
        workshop, or competition, Eventity makes staying connected easier than ever!
      </p>

      <p
        style={{
          marginTop: "40px",
          fontSize: "1.2rem",
          color: "#444",
        }}
      >
        Get started by{" "}
        <Link
          to="/login"
          style={{
            color: "#007bff",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Logging in
        </Link>{" "}
        or{" "}
        <Link
          to="/signup"
          style={{
            color: "#28a745",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Signing up!
        </Link>
      </p>
    </div>
  );
}
