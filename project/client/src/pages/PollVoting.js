import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:3000/api/polls";

export default function PollVoting() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [showModal, setShowModal] = useState(false);

  // Auto-hide modal after 4 seconds
  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(() => setShowModal(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showModal]);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const res = await axios.get(API_URL);
        setPolls(res.data || []);
        setMessage("");
      } catch (error) {
        setMessageType("error");
        setMessage("Failed to load polls.");
        setShowModal(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPolls();
  }, []);

  const submitVote = async (pollId, candidateId) => {
    let email = null;

    try {
      const raw =
        localStorage.getItem("user") || localStorage.getItem("currentUser");

      if (raw) {
        const u = JSON.parse(raw);
        if (u && u.email) {
          email = u.email;
        }
      }
    } catch (err) {
      console.error("Failed to read user from localStorage:", err);
    }

    if (!email) {
      setMessageType("error");
      setMessage("Error: User is not logged in.");
      setShowModal(true);
      return;
    }

    try {
      await axios.post(`${API_URL}/${pollId}/vote`, {
        candidateId,
        email,
      });

      setMessageType("success");
      setMessage("Your vote has been successfully submitted!");
      setShowModal(true);
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.error || "Failed to vote.");
      setShowModal(true);
    }
  };

  if (loading) return <p>Loading polls...</p>;

  return (
    <div style={{ padding: "20px", position: "relative" }}>
      {/* ===== POPUP MODAL MESSAGE ===== */}
      {showModal && (
        <>
          {/* Dim Background */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(2px)",
              zIndex: 1000,
            }}
            onClick={() => setShowModal(false)}
          ></div>

          {/* Popup Box */}
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) scale(1)",
              background: "#fff",
              padding: "25px 30px",
              borderRadius: "12px",
              width: "350px",
              maxWidth: "90%",
              textAlign: "center",
              boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
              zIndex: 1001,
              animation: "fadeIn 0.25s ease",
            }}
          >
            <h3
              style={{
                marginBottom: "10px",
                color: messageType === "success" ? "#0f5132" : "#842029",
              }}
            >
              {messageType === "success" ? "Success!" : "Error"}
            </h3>

            <p style={{ marginBottom: "20px" }}>{message}</p>

            <button
              onClick={() => setShowModal(false)}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                background: messageType === "success" ? "#0f5132" : "#842029",
                color: "white",
              }}
            >
              Close
            </button>
          </div>
        </>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translate(-50%, -45%) scale(0.95); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
        `}
      </style>

      <h1
        style={{
          textAlign: "center",
          marginBottom: "25px",
          fontSize: "2rem",
          fontWeight: "700",
        }}
      >
        Vote on Booth Conflict Polls
      </h1>

      {/* ======================== POLLS ======================== */}
      {polls.length === 0 ? (
        <p>No polls found.</p>
      ) : (
        polls.map((poll) => (
          <div
            key={poll._id}
            style={{
              border: "1px solid #ccc",
              padding: "25px",
              borderRadius: "12px",
              marginBottom: "25px",
              maxWidth: "650px",
              marginInline: "auto",
              background: "#ffffff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <h2 style={{ textAlign: "center", marginBottom: "10px" }}>
              {poll.title}
            </h2>

            <p style={{ textAlign: "center", color: "#666" }}>
              <strong>Ends:</strong>{" "}
              {new Date(poll.endDate).toLocaleString()}
            </p>

            {/* Booth Details */}
            <div
              style={{
                background: "#f1f5f9",
                padding: "15px",
                borderRadius: "10px",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              <h3 style={{ marginBottom: "10px", color: "#333" }}>
                Booth Details
              </h3>
              <p>
                <strong>Booth Size:</strong>{" "}
                {poll.candidates[0]?.boothSize}
              </p>
              <p>
                <strong>Duration (Weeks):</strong>{" "}
                {poll.candidates[0]?.durationWeeks}
              </p>
              <p>
                <strong>Platform Slot:</strong>{" "}
                {poll.candidates[0]?.platformSlot}
              </p>
            </div>

            {/* Candidates */}
            <h3 style={{ textAlign: "center", marginBottom: "15px" }}>
              Vendors Competing
            </h3>

            {poll.candidates.map((c) => (
  <div
    key={c._id}
    style={{
      marginBottom: "15px",
      padding: "15px",
      border: "1px solid #e5e7eb",
      borderRadius: "10px",
      background: "#fafafa",
      textAlign: "center",
    }}
  >
    {/* Vendor Name */}
    <p
      style={{
        fontSize: "1.1rem",
        fontWeight: "600",
        marginBottom: "5px",
      }}
    >
      {c.vendorName}
    </p>

    {/* Vote Count */}
    <p
      style={{
        fontSize: "0.95rem",
        fontWeight: "500",
        color: "#444",
        marginBottom: "12px",
      }}
    >
      Votes: <strong>{c.votes}</strong>
    </p>

    {/* Vote button */}
    <button
      onClick={() => submitVote(poll._id, c._id)}
      style={{
        background: "#2563eb",
        color: "white",
        border: "none",
        padding: "10px 20px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "1rem",
        fontWeight: "600",
        transition: "0.2s",
      }}
      onMouseOver={(e) => (e.target.style.background = "#1d4ed8")}
      onMouseOut={(e) => (e.target.style.background = "#2563eb")}
    >
      Vote for {c.vendorName}
    </button>
  </div>
))}

          </div>
        ))
      )}
    </div>
  );
}
