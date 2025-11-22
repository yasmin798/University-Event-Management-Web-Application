// client/src/pages/VendorRequests.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { LogOut } from "lucide-react";
import "../events.theme.css";
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
  if (vendorTarget.type === "bazaar") {
    detailsString = `Bazaar Title: ${vendorTarget.details.bazaarTitle || "N/A"}\nLocation: ${vendorTarget.details.location || "N/A"}\nStart: ${vendorTarget.details.start || "N/A"}\nEnd: ${vendorTarget.details.end || "N/A"}\nBooth Size: ${vendorTarget.details.boothSize || "N/A"}`;
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

export default function VendorRequests() {
  const { id: bazaarId } = useParams();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState("All");
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

  const getBazaarId = (req) => {
    if (!req) return null;
    if (req.bazaar && typeof req.bazaar === "string") return req.bazaar;
    if (req.bazaar && req.bazaar._id) return req.bazaar._id;
    if (req.bazaarId) return req.bazaarId;
    return null;
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const attempts = [
        `${API_ORIGIN}/api/bazaar-applications/bazaar/${bazaarId}`,
        `${API_ORIGIN}/api/bazaar-applications?bazaar=${bazaarId}`,
        `${API_ORIGIN}/api/bazaar-applications`,
      ];

      let res = null;
      let data = null;

      for (let url of attempts) {
        try {
          res = await axios.get(url);
          if (res && res.status >= 200 && res.status < 300) {
            data = res.data;
            break;
          }
        } catch {
          continue;
        }
      }

      if (!data) throw new Error("No data returned.");

      let arr = [];
      if (Array.isArray(data)) arr = data;
      else if (Array.isArray(data.requests)) arr = data.requests;
      else if (Array.isArray(data.items)) arr = data.items;
      else if (data._id) arr = [data];

      const filtered = arr.filter(
        (r) => String(getBazaarId(r)) === String(bazaarId)
      );

      setRequests(filtered);
      if (filtered.length === 0)
        setError("No vendor requests for this bazaar.");
    } catch (err) {
      setError("Failed to load vendor requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [bazaarId]);

  const updateStatusOnServer = async (requestId, newStatus) => {
    const urls = [
      `${API_ORIGIN}/api/admin/bazaar-vendor-requests/${requestId}`,
      `${API_ORIGIN}/api/bazaar-applications/${requestId}`,
      `${API_ORIGIN}/api/bazaar-vendor-requests/${requestId}`,
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
          ? "This will accept the vendor bazaar request."
          : "This will reject the vendor bazaar request.",
    });
    setConfirmOpen(true);
  };

  return (
    <div
      className="events-theme"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      <Sidebar filter={filter} setFilter={setFilter} />

      {/* ---------- MAIN CONTENT (NO TOP PANEL) ---------- */}
      <main style={{ flex: 1, padding: "20px", marginLeft: "260px" }}>
        <h1>Vendor Participation Requests</h1>

        {loading ? (
          <p>Loading…</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : requests.length === 0 ? (
          <p>No vendor requests for this bazaar.</p>
        ) : (
          <ul className="space-y-4">
            {requests.map((req) => {
              const firstAtt = Array.isArray(req.attendees)
                ? req.attendees[0]
                : null;
              const vendorName =
                req.vendorName || firstAtt?.name || "Unknown Vendor";
              const vendorEmail =
                req.vendorEmail || firstAtt?.email || "No email";
              const boothSize = req.boothSize || "N/A";

              const attendeesList = Array.isArray(req.attendees)
                ? req.attendees.map((a) => `${a.name} <${a.email}>`).join(", ")
                : "";

              const description =
                req.description ||
                (boothSize
                  ? `Booth: ${boothSize}. Attendees: ${attendeesList}`
                  : "No description");

              const status = (req.status || "pending").toLowerCase();

              return (
                <li
                  key={req._id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
                >
                  <div>
                    <strong>Vendor Name:</strong> {vendorName}
                  </div>
                  <div>
                    <strong>Email:</strong> {vendorEmail}
                  </div>
                  <div>
                    <strong>Description:</strong> {description}
                  </div>
                  <div>
                    <strong>Status:</strong>{" "}
                    <span
                      style={{
                        color:
                          status === "accepted"
                            ? "green"
                            : status === "rejected"
                            ? "red"
                            : "gray",
                        fontWeight: "bold",
                      }}
                    >
                      {status}
                    </span>
                  </div>

                  {status === "pending" && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => openConfirm(req._id, "accepted")}
                        className="btn"
                        disabled={processingId === req._id}
                      >
                        {processingId === req._id ? "Processing…" : "Accept"}
                      </button>
                      <button
                        onClick={() => openConfirm(req._id, "rejected")}
                        className="btn btn-outline"
                        disabled={processingId === req._id}
                      >
                        {processingId === req._id ? "Processing…" : "Reject"}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
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
              bazaarTitle: req.bazaar?.title || "N/A",
              location: req.bazaar?.location || "N/A",
              start: req.bazaar?.startDateTime || "N/A",
              end: req.bazaar?.endDateTime || "N/A",
              boothSize: req.boothSize || "N/A",
            };
            setVendorTarget({
              requestId: confirmData.requestId,
              type: "bazaar",
              newStatus: confirmData.newStatus,
              vendorName: req.vendorName || (req.attendees?.[0]?.name || "Vendor"),
              vendorEmail: req.vendorEmail || (req.attendees?.[0]?.email || ""),
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