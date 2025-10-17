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
  const [processingId, setProcessingId] = useState(null);

  // <-- change this if your backend runs on a different host/port -->
  const API_ORIGIN = "http://localhost:3001";

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError("");

        // Try admin/public endpoints (choose the one your server exposes)
        const endpoints = [
          `${API_ORIGIN}/api/booth-applications`, // common public list
          `${API_ORIGIN}/api/admin/booth-vendor-requests`, // admin route
          `${API_ORIGIN}/api/booth-vendor-requests`, // alternate
        ];

        let data = null;
        for (const url of endpoints) {
          try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const text = await res.text();
            const parsed = text ? JSON.parse(text) : null;
            // Accept either an array or object with .requests/.items
            if (Array.isArray(parsed)) {
              data = parsed;
              break;
            } else if (parsed && Array.isArray(parsed.requests)) {
              data = parsed.requests;
              break;
            } else if (parsed && Array.isArray(parsed.items)) {
              data = parsed.items;
              break;
            }
          } catch (e) {
            // try next
            console.warn("booth list fetch failed for", url, e);
          }
        }

        if (!data) {
          throw new Error("Could not fetch booth requests from server");
        }

        // Normalize: ensure each request has _id (or id) and fields used below
        setRequests(
          data.map((r) => ({
            _id: r._id || r.id || null,
            name: r.vendorName || (r.attendees && r.attendees[0] && r.attendees[0].name) || r.name || "",
            email: r.vendorEmail || (r.attendees && r.attendees[0] && r.attendees[0].email) || r.email || "",
            duration:
              r.duration ||
              r.durationWeeks ||
              (r.meta && r.meta.duration) ||
              r.setupDuration ||
              r.weeks ||
              r.timeframe ||
              "",
            location:
              (r.location && String(r.location)) ||
              r.selectedLocation ||
              r.locationChoice ||
              r.slot ||
              r.platformSlot ||
              r.boothLocation ||
              "",
            boothSize: r.boothSize || r.size || "",
            status: (r.status || r.state || "pending").toLowerCase(),
            raw: r, // keep original for debugging if needed
          }))
        );
      } catch (err) {
        console.error("Failed to load booth requests:", err);
        setError("Failed to load booth requests from server");
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [bazaarId]);

  const updateStatusOnServer = async (appId, newStatus) => {
    if (!appId) throw new Error("Missing application id");
    // Try admin route first, fallback to generic application route
    const urlsToTry = [
      `${API_ORIGIN}/api/admin/booth-vendor-requests/${appId}`,
      `${API_ORIGIN}/api/booth-applications/${appId}`,
      `${API_ORIGIN}/api/booth-vendor-requests/${appId}`,
    ];

    for (const url of urlsToTry) {
      try {
        const res = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        const text = await res.text();
        let body;
        try { body = text ? JSON.parse(text) : null; } catch (e) { body = text; }
        if (res.ok) {
          console.log("Status updated on", url, body);
          return { ok: true, body };
        } else {
          console.warn("Patch returned not-ok from", url, res.status, body);
          // try next
        }
      } catch (err) {
        console.warn("Patch error for", url, err);
      }
    }

    throw new Error("Failed to update application on server (all endpoints tried)");
  };

  const handleDecision = async (requestId, newStatus) => {
    if (!window.confirm(`Are you sure you want to ${newStatus.toUpperCase()} this booth request?`)) return;

    setProcessingId(requestId);
    setError("");

    try {
      // send to server
      const result = await updateStatusOnServer(requestId, newStatus);
      if (result.ok) {
        // update local state with confirmed status
        setRequests((prev) =>
          prev.map((r) => (r._id === requestId ? { ...r, status: newStatus } : r))
        );
      } else {
        throw new Error("Server did not accept the update");
      }
    } catch (err) {
      console.error(`Failed to ${newStatus} booth request:`, err);
      setError(`Failed to ${newStatus} booth request. Check console for details.`);
      alert(`Failed to ${newStatus} booth request. See console.`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAccept = (requestId) => handleDecision(requestId, "accepted");
  const handleReject = (requestId) => handleDecision(requestId, "rejected");

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
                key={req._id || req.raw._id || Math.random()}
                style={{
                  marginBottom: "1.5rem",
                  padding: "1rem",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                }}
              >
                <div><strong>Application ID:</strong> {req._id || "—"}</div>
                <div><strong>Name:</strong> {req.name || "—"}</div>
                <div><strong>Email:</strong> {req.email || "—"}</div>
                <div><strong>Duration:</strong> {req.duration || "—"}</div>
                <div><strong>Booth Location:</strong> {req.location || "—"}</div>
                <div><strong>Booth Size:</strong> {req.boothSize || "—"}</div>
                <div><strong>Status:</strong> <span style={{ fontWeight: 700 }}>{req.status}</span></div>
                <div style={{ marginTop: "0.5rem" }}>
                  <button
                    onClick={() => handleAccept(req._id)}
                    style={{ marginRight: "0.5rem" }}
                    disabled={processingId === req._id}
                  >
                    {processingId === req._id ? "Processing..." : "Accept"}
                  </button>
                  <button
                    onClick={() => handleReject(req._id)}
                    disabled={processingId === req._id}
                  >
                    {processingId === req._id ? "Processing..." : "Reject"}
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
