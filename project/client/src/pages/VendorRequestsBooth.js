import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import "../events.theme.css"; // make sure the confirm modal styles are loaded

function ConfirmModal({ open, title, body, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div
      className="confirm-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="confirm">
        <h2 id="confirm-title">{title}</h2>
        <p>{body}</p>
        <div className="confirm-actions">
          <button className="btn btn-outline" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn" onClick={onConfirm}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VendorRequestsBooth() {
  const { id: bazaarId } = useParams();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  // NEW: confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState({
    requestId: null,
    newStatus: null,
    title: "",
    body: "",
  });

  // change if your backend runs elsewhere
  const API_ORIGIN = "http://localhost:3001";

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError("");

        const endpoints = [
          `${API_ORIGIN}/api/booth-applications`,
          `${API_ORIGIN}/api/admin/booth-vendor-requests`,
          `${API_ORIGIN}/api/booth-vendor-requests`,
        ];

        let data = null;
        for (const url of endpoints) {
          try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const text = await res.text();
            const parsed = text ? JSON.parse(text) : null;
            if (Array.isArray(parsed)) {
              data = parsed;
              break;
            }
            if (parsed && Array.isArray(parsed.requests)) {
              data = parsed.requests;
              break;
            }
            if (parsed && Array.isArray(parsed.items)) {
              data = parsed.items;
              break;
            }
          } catch (e) {
            console.warn("booth list fetch failed for", url, e);
          }
        }

        if (!data)
          throw new Error("Could not fetch booth requests from server");

        setRequests(
          data.map((r) => ({
            _id: r._id || r.id || null,
            name:
              r.vendorName ||
              (r.attendees && r.attendees[0] && r.attendees[0].name) ||
              r.name ||
              "",
            email:
              r.vendorEmail ||
              (r.attendees && r.attendees[0] && r.attendees[0].email) ||
              r.email ||
              "",
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
            raw: r,
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
  }, [bazaarId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateStatusOnServer = async (appId, newStatus) => {
    if (!appId) throw new Error("Missing application id");
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
        try {
          body = text ? JSON.parse(text) : null;
        } catch {
          body = text;
        }
        if (res.ok) {
          console.log("Status updated on", url, body);
          return { ok: true, body };
        } else {
          console.warn("Patch returned not-ok from", url, res.status, body);
        }
      } catch (err) {
        console.warn("Patch error for", url, err);
      }
    }
    throw new Error(
      "Failed to update application on server (all endpoints tried)"
    );
  };

  // Original action but without window.confirm; this is called after modal OK
  const handleDecision = async (requestId, newStatus) => {
    setProcessingId(requestId);
    setError("");

    try {
      const result = await updateStatusOnServer(requestId, newStatus);
      if (result.ok) {
        setRequests((prev) =>
          prev.map((r) =>
            r._id === requestId ? { ...r, status: newStatus } : r
          )
        );
      } else {
        throw new Error("Server did not accept the update");
      }
    } catch (err) {
      console.error(`Failed to ${newStatus} booth request:`, err);
      setError(
        `Failed to ${newStatus} booth request. Check console for details.`
      );
      alert(`Failed to ${newStatus} booth request. See console.`);
    } finally {
      setProcessingId(null);
    }
  };

  // Open the themed modal with the correct copy
  const openConfirm = (requestId, newStatus) => {
    const verb = newStatus === "accepted" ? "ACCEPT" : "REJECT";
    setConfirmData({
      requestId,
      newStatus,
      title:
        newStatus === "accepted"
          ? "Accept this booth request?"
          : "Reject this booth request?",
      body:
        newStatus === "accepted"
          ? "This will mark the application as accepted."
          : "This will mark the application as rejected.",
    });
    setConfirmOpen(true);
  };

  // Button handlers now open the modal
  const handleAccept = (requestId) => openConfirm(requestId, "accepted");
  const handleReject = (requestId) => openConfirm(requestId, "rejected");

  return (
    <div className="events-theme">
      <div className="container">
        <NavBar bleed />

        <div className="eo-head-row">
          <h1>Booth Requests</h1>
          <button
            type="button"
            className="btn btn-outline eo-back"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            Back
          </button>
        </div>

        {loading ? (
          <p className="empty">Loading…</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : requests.length === 0 ? (
          <p className="empty">No booth requests.</p>
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
                  background: "#fff",
                }}
              >
                <div>
                  <strong>Application ID:</strong> {req._id || "—"}
                </div>
                <div>
                  <strong>Name:</strong> {req.name || "—"}
                </div>
                <div>
                  <strong>Email:</strong> {req.email || "—"}
                </div>
                <div>
                  <strong>Duration:</strong> {req.duration || "—"}
                </div>
                <div>
                  <strong>Booth Location:</strong> {req.location || "—"}
                </div>
                <div>
                  <strong>Booth Size:</strong> {req.boothSize || "—"}
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  <span style={{ fontWeight: 700 }}>{req.status}</span>
                </div>
                <div style={{ marginTop: "0.5rem" }}>
                  <button
                    onClick={() => handleAccept(req._id)}
                    style={{ marginRight: "0.5rem" }}
                    disabled={processingId === req._id}
                    className="btn"
                  >
                    {processingId === req._id ? "Processing..." : "Accept"}
                  </button>
                  <button
                    onClick={() => handleReject(req._id)}
                    disabled={processingId === req._id}
                    className="btn btn-outline"
                  >
                    {processingId === req._id ? "Processing..." : "Reject"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Themed confirmation modal (same look as Bazaar/Trip forms) */}
        <ConfirmModal
          open={confirmOpen}
          title={confirmData.title}
          body={confirmData.body}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            handleDecision(confirmData.requestId, confirmData.newStatus);
          }}
        />
      </div>
    </div>
  );
}
