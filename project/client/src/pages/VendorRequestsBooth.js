// client/src/pages/VendorRequestsBooth.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";

export default function VendorRequestsBooth() {
  const { id: bazaarId } = useParams();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`http://localhost:3001/api/bazaars/${bazaarId}/vendor-requests`);
        if (!res.ok) throw new Error("Failed to fetch booth requests");
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load booth requests from server");
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    if (bazaarId) fetchRequests();
  }, [bazaarId]);

  const handleAccept = (requestId) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "ACCEPTED" } : r))
    );
    alert(`Accepted booth request ${requestId}`);
    // TODO: send update to backend
  };

  const handleReject = (requestId) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "REJECTED" } : r))
    );
    alert(`Rejected booth request ${requestId}`);
    // TODO: send update to backend
  };

  return (
    <div className="events-theme">
      <div className="container">
        <NavBar bleed />

        <h1>Booth Requests</h1>
        <button onClick={() => navigate(-1)}>← Back</button>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : requests.length === 0 ? (
          <p>No booth requests.</p>
        ) : (
          <ul>
            {requests.map((req) => (
              <li
                key={req.id}
                style={{
                  marginBottom: "1.5rem",
                  padding: "1rem",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                }}
              >
                <div><strong>Name:</strong> {req.name}</div>
                <div><strong>Email:</strong> {req.email}</div>
                <div><strong>Duration:</strong> {req.duration}</div>
                <div><strong>Booth Location:</strong> {req.location}</div>
                <div><strong>Booth Size:</strong> {req.boothSize}</div>
                <div><strong>Status:</strong> {req.status || "PENDING"}</div>
                <div style={{ marginTop: "0.5rem" }}>
                  <button onClick={() => handleAccept(req.id)} style={{ marginRight: "0.5rem" }}>
                    Accept
                  </button>
                  <button onClick={() => handleReject(req.id)}>
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
