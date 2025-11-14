import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../events.theme.css";
import { LogOut } from "lucide-react";
import Sidebar from "../components/Sidebar";

function ConfirmModal({ open, title, body, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="confirm">
        <h2>{title}</h2>
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
  const [filter, setFilter] = useState("All");

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  // modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState({
    requestId: null,
    newStatus: null,
    title: "",
    body: "",
  });

  const API_ORIGIN = "http://localhost:3001";

  // ---------- FETCH REQUESTS ----------
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
            if (parsed?.requests) {
              data = parsed.requests;
              break;
            }
            if (parsed?.items) {
              data = parsed.items;
              break;
            }
          } catch (e) {}
        }

        if (!data) throw new Error("Could not fetch booth requests");

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
        setError("Failed to load booth requests");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [bazaarId]);

  // ---------- PATCH STATUS ----------
  const updateStatusOnServer = async (appId, newStatus) => {
    const urls = [
      `${API_ORIGIN}/api/admin/booth-vendor-requests/${appId}`,
      `${API_ORIGIN}/api/booth-applications/${appId}`,
      `${API_ORIGIN}/api/booth-vendor-requests/${appId}`,
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        if (res.ok) return true;
      } catch {}
    }

    throw new Error("Failed update");
  };

  const handleDecision = async (requestId, newStatus) => {
    setProcessingId(requestId);

    try {
      await updateStatusOnServer(requestId, newStatus);

      setRequests((prev) =>
        prev.map((r) => (r._id === requestId ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      alert("Failed to update.");
    } finally {
      setProcessingId(null);
    }
  };

  const openConfirm = (id, status) => {
    setConfirmData({
      requestId: id,
      newStatus: status,
      title: status === "accepted" ? "Accept request?" : "Reject request?",
      body:
        status === "accepted"
          ? "This will accept the vendor booth request."
          : "This will reject the vendor booth request.",
    });
    setConfirmOpen(true);
  };

  return (
    <div
      className="events-theme"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      {" "}
      <Sidebar filter={filter} setFilter={setFilter} />
      {/* ---------- MAIN CONTENT ---------- */}
      <main style={{ flex: 1, padding: "20px", marginLeft: "260px" }}>
        <h1>Booth Requests</h1>

        {loading && <p>Loading…</p>}

        {!loading && error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && requests.length === 0 && (
          <p>No booth requests.</p>
        )}

        {/* LONG VENDOR-STYLE CARDS */}
        {!loading && !error && requests.length > 0 && (
          <div className="space-y-6">
            {requests.map((req) => (
              <div
                key={req._id}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
              >
                <div className="mb-3">
                  <strong className="block text-gray-700">Application:</strong>
                  <span className="text-gray-900">{req._id || "—"}</span>
                </div>

                <div className="mb-3">
                  <strong className="block text-gray-700">Name:</strong>
                  <span className="text-gray-900">{req.name || "—"}</span>
                </div>

                <div className="mb-3">
                  <strong className="block text-gray-700">Email:</strong>
                  <span className="text-gray-900">{req.email || "—"}</span>
                </div>

                <div className="mb-3">
                  <strong className="block text-gray-700">Duration:</strong>
                  <span className="text-gray-900">{req.duration || "—"}</span>
                </div>

                <div className="mb-3">
                  <strong className="block text-gray-700">Location:</strong>
                  <span className="text-gray-900">{req.location || "—"}</span>
                </div>

                <div className="mb-3">
                  <strong className="block text-gray-700">Size:</strong>
                  <span className="text-gray-900">{req.boothSize || "—"}</span>
                </div>

                <div className="mb-4">
                  <strong className="block text-gray-700">Status:</strong>
                  <span
                    className="font-semibold"
                    style={{
                      color:
                        req.status === "accepted"
                          ? "green"
                          : req.status === "rejected"
                          ? "red"
                          : "gray",
                    }}
                  >
                    {req.status}
                  </span>
                </div>

                {req.status === "pending" && (
                  <div className="flex gap-3">
                    <button
                      className="btn"
                      disabled={processingId === req._id}
                      onClick={() => openConfirm(req._id, "accepted")}
                    >
                      {processingId === req._id ? "Processing…" : "Accept"}
                    </button>

                    <button
                      className="btn btn-outline"
                      disabled={processingId === req._id}
                      onClick={() => openConfirm(req._id, "rejected")}
                    >
                      {processingId === req._id ? "Processing…" : "Reject"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

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
      </main>
    </div>
  );
}
