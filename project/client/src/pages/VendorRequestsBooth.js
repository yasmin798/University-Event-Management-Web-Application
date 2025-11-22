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
function VendorMailPopup({ onClose, onSend, sending, vendorTarget }) {
  const isAccepted = vendorTarget.newStatus === "accepted";
  const typeCapitalized = vendorTarget.type.charAt(0).toUpperCase() + vendorTarget.type.slice(1);
  let detailsString = "";
  if (vendorTarget.type === "booth") {
    detailsString = `Booth ID: ${vendorTarget.details.boothId}\nLocation: ${vendorTarget.details.location}\nDuration: ${vendorTarget.details.duration || "N/A"}`;
  }
  return (
    <div style={popupOverlayStyle}>
      <div style={popupHeaderStyle}>
        <div>
          <h3 style={{ margin: 0 }}>New Message</h3>
          <p style={{ color: "#E5E7EB", fontSize: 14 }}>Vendor Notification</p>
        </div>
        <button onClick={onClose} style={closeBtnStyle}>
          ✕
        </button>
      </div>
      <div style={popupContentStyle}>
        <div style={mailRowStyle}>
          <b>To:</b> {vendorTarget.vendorEmail}
        </div>
        <div style={mailRowStyle}>
          <b>Subject:</b> Your {typeCapitalized} Vendor Request Has Been {isAccepted ? "Accepted" : "Rejected"}
        </div>
        <div style={mailBodyStyle}>
          <p>Dear {vendorTarget.vendorName},</p>
          <p>Your {vendorTarget.type} vendor request has been {vendorTarget.newStatus} by the admin.</p>
          <p>Details:</p>
          <pre style={{ whiteSpace: "pre-wrap" }}>{detailsString}</pre>
          {isAccepted ? (
            <p>We look forward to your participation!</p>
          ) : (
            <p>If you have any questions, please contact support.</p>
          )}
          <p>— Admin Team</p>
        </div>
      </div>
      <div style={popupFooterStyle}>
        <button onClick={onSend} style={sendBtnStyle} disabled={sending}>
          {sending ? "Sending..." : "Send"}
        </button>
        <button onClick={onClose} style={cancelBtnStyle}>
          Cancel
        </button>
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
  const [showVendorMailPopup, setShowVendorMailPopup] = useState(false);
  const [vendorTarget, setVendorTarget] = useState(null);
  const [sending, setSending] = useState(false);
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
  const handleSendVendorMail = async () => {
    if (!vendorTarget) return;
    setSending(true);
    setProcessingId(vendorTarget.requestId);
    try {
      await updateStatusOnServer(vendorTarget.requestId, vendorTarget.newStatus);
      const mailRes = await fetch(`${API_ORIGIN}/api/admin/send-vendor-notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: vendorTarget.vendorEmail,
          requestId: vendorTarget.requestId,
          status: vendorTarget.newStatus,
          type: vendorTarget.type,
          details: vendorTarget.details,
        }),
      });
      const mailData = await mailRes.json();
      if (mailRes.ok) {
        setRequests((prev) =>
          prev.map((r) => (r._id === vendorTarget.requestId ? { ...r, status: vendorTarget.newStatus } : r))
        );
        alert(`✅ Vendor request ${vendorTarget.newStatus} and notification sent successfully!`);
      } else {
        alert(`✅ Vendor request ${vendorTarget.newStatus}, but email failed: ${mailData.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error handling vendor request:", err);
      alert("❌ Server error during request handling");
    } finally {
      setSending(false);
      setShowVendorMailPopup(false);
      setVendorTarget(null);
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
            const req = requests.find((r) => r._id === confirmData.requestId);
            if (!req) return;
            const details = {
              boothId: req._id,
              location: req.location,
              duration: req.duration,
            };
            setVendorTarget({
              requestId: confirmData.requestId,
              type: "booth",
              newStatus: confirmData.newStatus,
              vendorName: req.name,
              vendorEmail: req.email,
              details,
            });
            setShowVendorMailPopup(true);
          }}
        />
        {showVendorMailPopup && vendorTarget && (
          <VendorMailPopup
            onClose={() => setShowVendorMailPopup(false)}
            onSend={handleSendVendorMail}
            sending={sending}
            vendorTarget={vendorTarget}
          />
        )}
      </main>
    </div>
  );
}
/* ===== Styles ===== */
const popupOverlayStyle = {
  position: "fixed",
  bottom: 0,
  right: 20,
  width: 400,
  backgroundColor: "white",
  borderRadius: "10px 10px 0 0",
  boxShadow: "0 -4px 15px rgba(0,0,0,0.2)",
  display: "flex",
  flexDirection: "column",
  zIndex: 999,
};
const popupHeaderStyle = {
  background: "#3B82F6",
  color: "white",
  padding: "10px 15px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const closeBtnStyle = {
  background: "transparent",
  border: "none",
  color: "white",
  fontSize: 18,
  cursor: "pointer",
};
const popupContentStyle = {
  padding: "10px 15px",
  flexGrow: 1,
  overflowY: "auto",
};
const mailRowStyle = {
  padding: "5px 0",
  borderBottom: "1px solid #E5E7EB",
  fontSize: 14,
};
const mailBodyStyle = { padding: "10px 0", fontSize: 14, color: "#111827" };
const popupFooterStyle = {
  padding: "10px 15px",
  borderTop: "1px solid #E5E7EB",
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};
const sendBtnStyle = {
  backgroundColor: "#10B981",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "8px 16px",
  cursor: "pointer",
  fontWeight: 500,
};
const cancelBtnStyle = {
  backgroundColor: "#9CA3AF",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "8px 16px",
  cursor: "pointer",
};