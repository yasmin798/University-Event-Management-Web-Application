import React, { useEffect, useState } from "react";
import axios from "axios";
import ProfessorSidebar from "../components/ProfessorSidebar";

const API_URL = "http://localhost:3000/api/polls";

export default function PollVoting() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Get logged-in user's email
  const getUserEmail = () => {
    try {
      const userData = localStorage.getItem("user") || localStorage.getItem("currentUser");
      if (userData) {
        const user = JSON.parse(userData);
        return user.email || user.user?.email;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const userEmail = getUserEmail();

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const res = await axios.get(API_URL);
      setPolls(res.data || []);
    } catch (err) {
      showMessage("Failed to load polls", "error");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, type = "success") => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(""), 4000);
  };

  const submitVote = async (pollId, candidateId, vendorName) => {
    if (!userEmail) {
      showMessage("Please log in to vote", "error");
      return;
    }

    try {
      await axios.post(`${API_URL}/${pollId}/vote`, {
        email: userEmail,
        candidateId,
      });

      showMessage(`Voted for ${vendorName}!`);
      fetchPolls(); // refresh to update votes
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to vote";
      showMessage(errorMsg.includes("already voted") ? "You already voted!" : errorMsg, "error");
    }
  };

  const removeVote = async (pollId, candidateId) => {  // ← now accepts candidateId
  if (!userEmail) {
    showMessage("Not logged in", "error");
    return;
  }

  try {
    await axios.post(`${API_URL}/${pollId}/remove-vote`, {
      email: userEmail,
      candidateId: candidateId,   // ← send the candidate they voted for
    });

    showMessage("Vote removed – you can vote again!");
    fetchPolls(); // refresh UI
  } catch (err) {
    showMessage(err.response?.data?.error || "Failed to remove vote", "error");
  }
};

  if (loading) return <div style={{ textAlign: "center", padding: "40px" }}>Loading polls...</div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <ProfessorSidebar />
      <div style={{ flex: 1, marginLeft: "260px", padding: "30px 20px", fontFamily: "system-ui, sans-serif", overflowY: "auto" }}>
      {/* Floating Message */}
      {message && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 1000,
          background: message.type === "error" ? "#fee2e2" : "#d1fae5",
          color: message.type === "error" ? "#991b1b" : "#065f46",
          padding: "12px 24px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          fontWeight: "600"
        }}>
          {message.text}
        </div>
      )}

      <h1 style={{ textAlign: "center", fontSize: "2.5rem", fontWeight: "800", color: "#1e293b", marginBottom: "40px" }}>
        Booth Vendor Voting
      </h1>

      {polls.length === 0 ? (
        <p style={{ textAlign: "center", color: "#64748b", fontSize: "1.2rem" }}>No active polls right now.</p>
      ) : (
        polls.map(poll => {
          const totalVotes = poll.candidates.reduce((sum, c) => sum + c.votes, 0);
          const userHasVoted = userEmail && poll.votedUsers.includes(userEmail);
          const userVotedFor = userHasVoted
            ? poll.candidates.find(c => c._id.toString() === poll.votedUsers.find(e => e === userEmail)?.candidateId)
            : null;

          return (
            <div key={poll._id} style={{
              maxWidth: "750px", margin: "40px auto", background: "white",
              borderRadius: "20px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
            }}>
              {/* Header */}
              <div style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", color: "white", padding: "25px", textAlign: "center" }}>
                <h2 style={{ margin: 0, fontSize: "1.8rem", fontWeight: "700" }}>{poll.title}</h2>
                <p style={{ margin: "10px 0 0", opacity: 0.9 }}>
                  Ends: {new Date(poll.endDate).toLocaleString()}
                </p>
              </div>

              {/* Booth Info */}
              <div style={{ padding: "20px", background: "#f8fafc", textAlign: "center", fontSize: "1.1rem" }}>
                <strong>Slot:</strong> {poll.candidates[0]?.platformSlot} • 
                <strong> Size:</strong> {poll.candidates[0]?.boothSize} • 
                <strong> Duration:</strong> {poll.candidates[0]?.durationWeeks} weeks
                <div style={{ marginTop: "10px", color: "#6366f1", fontWeight: "600" }}>
                  Total Votes: {totalVotes}
                </div>
              </div>

              {/* Candidates */}
              <div style={{ padding: "25px" }}>
                {poll.candidates.map(c => {
                  const percentage = totalVotes > 0 ? (c.votes / totalVotes) * 100 : 0;
                  const isLeading = c.votes === Math.max(...poll.candidates.map(x => x.votes));
                  const isUserVote = userHasVoted && userEmail === c.votedBy; // fallback if needed

                  return (
                    <div key={c._id} style={{
                      marginBottom: "20px", padding: "20px", borderRadius: "16px",
                      background: isLeading ? "#f0e8ff" : "#ffffff",
                      border: isLeading ? "2px solid #8b5cf6" : "2px solid #e2e8f0",
                      position: "relative", boxShadow: isLeading ? "0 6px 20px rgba(139,92,246,0.15)" : "0 4px 12px rgba(0,0,0,0.05)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "700", color: "#1e293b" }}>
                          {c.vendorName}
                        </h3>
                        {isLeading && totalVotes > 0 && (
                          <span style={{ background: "#8b5cf6", color: "white", padding: "6px 12px", borderRadius: "20px", fontSize: "0.9rem", fontWeight: "600" }}>
                            Leading
                          </span>
                        )}
                        {userHasVoted && c.votes > 0 && c.votes === poll.candidates.find(cc => poll.votedUsers.includes(userEmail))?.votes && (
                          <span style={{ background: "#10b981", color: "white", padding: "6px 12px", borderRadius: "20px", fontSize: "0.9rem", fontWeight: "600" }}>
                            Your Vote
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div style={{ margin: "15px 0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.95rem", color: "#475569" }}>
                          <span>{c.votes} vote{c.votes !== 1 ? "s" : ""}</span>
                          <span>{percentage.toFixed(0)}%</span>
                        </div>
                        <div style={{ height: "12px", background: "#e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
                          <div style={{
                            height: "100%", width: `${percentage}%`,
                            background: isLeading ? "#8b5cf6" : "#3b82f6",
                            borderRadius: "6px",
                            transition: "width 0.6s ease"
                          }}></div>
                        </div>
                      </div>

                      <div style={{ marginTop: "12px" }}>
  {/* Normal Vote Button */}
  {!userHasVoted && (
    <button
      onClick={() => submitVote(poll._id, c._id, c.vendorName)}
      style={{
        width: "100%",
        padding: "14px",
        borderRadius: "12px",
        fontWeight: "700",
        background: "#2563eb",
        color: "white",
        border: "none",
        cursor: "pointer",
      }}
    >
      Vote for {c.vendorName}
    </button>
  )}

  {/* You Already Voted – Show Remove Vote Button */}
  {userHasVoted && (
    <div style={{ display: "flex", gap: "10px" }}>
      <button
        onClick={() => removeVote(poll._id, c._id)}
        style={{
          flex: 1,
          padding: "12px",
          borderRadius: "10px",
          background: "#ef4444",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontWeight: "600",
        }}
      >
      Remove Vote
      </button>

      <div style={{
        flex: 1,
        padding: "12px",
        background: "#10b981",
        color: "white",
        borderRadius: "10px",
        textAlign: "center",
        fontWeight: "600",
      }}>
        You Voted!
      </div>
    </div>
  )}
</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
      </div>
    </div>
  );
}