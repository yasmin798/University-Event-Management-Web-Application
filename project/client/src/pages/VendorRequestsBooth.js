import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../events.theme.css";
import {
  LogOut,
  Search,
  Filter,
  Clock,
  MapPin,
  Ruler,
  Mail,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
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
  const typeCapitalized =
    vendorTarget.type.charAt(0).toUpperCase() + vendorTarget.type.slice(1);
  let detailsString = "";
  if (vendorTarget.type === "booth") {
    detailsString = `Booth ID: ${vendorTarget.details.boothId}\nLocation: ${
      vendorTarget.details.location
    }\nDuration: ${vendorTarget.details.duration || "N/A"}`;
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
          <b>Subject:</b> Your {typeCapitalized} Vendor Request Has Been{" "}
          {isAccepted ? "Accepted" : "Rejected"}
        </div>
        <div style={mailBodyStyle}>
          <p>Dear {vendorTarget.vendorName},</p>
          <p>
            Your {vendorTarget.type} vendor request has been{" "}
            {vendorTarget.newStatus} by the admin.
          </p>
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
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter requests based on search
  const filteredRequests = requests.filter(
    (req) =>
      req.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
  const updateStatusOnServer = async (appId, newStatus, extraPayload = {}) => {
    const urls = [
      `${API_ORIGIN}/api/admin/booth-vendor-requests/${appId}`,
      `${API_ORIGIN}/api/booth-applications/${appId}`,
      `${API_ORIGIN}/api/booth-vendor-requests/${appId}`,
    ];

    const payload = { status: newStatus, ...extraPayload };

    for (const url of urls) {
      try {
        const res = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) return true;
      } catch (e) {
        console.log("Failed endpoint:", url);
      }
    }
    throw new Error("All endpoints failed");
  };

  const handleSendVendorMail = async () => {
    if (!vendorTarget) return;
    setSending(true);
    setProcessingId(vendorTarget.requestId);

    try {
      // 1. Update status + add payment deadline (only on accept)
      const updatePayload = {
        status: vendorTarget.newStatus,
      };

      // ONLY ADD DEADLINE IF ACCEPTED
      if (vendorTarget.newStatus === "accepted") {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 3); // 3 days from now
        updatePayload.paymentDeadline = deadline.toISOString();
      }

      // Try multiple endpoints (same as before)
      await updateStatusOnServer(
        vendorTarget.requestId,
        vendorTarget.newStatus,
        updatePayload
      );

      // 2. Send email notification
      const mailRes = await fetch(
        `${API_ORIGIN}/api/admin/send-vendor-notification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: vendorTarget.vendorEmail,
            requestId: vendorTarget.requestId,
            status: vendorTarget.newStatus,
            type: vendorTarget.type,
            details: vendorTarget.details,
          }),
        }
      );

      const mailData = await mailRes.json();

      if (mailRes.ok) {
        setRequests((prev) =>
          prev.map((r) =>
            r._id === vendorTarget.requestId
              ? {
                  ...r,
                  status: vendorTarget.newStatus,
                  paymentDeadline:
                    vendorTarget.newStatus === "accepted"
                      ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                      : r.paymentDeadline,
                }
              : r
          )
        );
        alert(
          `Vendor request ${vendorTarget.newStatus} and notification sent!`
        );

        // If accepted, show friendly reminder
        if (vendorTarget.newStatus === "accepted") {
          alert("Payment deadline set: 3 days from now");
        }
      } else {
        alert(
          `Request ${vendorTarget.newStatus}, but email failed: ${
            mailData.error || "Unknown"
          }`
        );
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Server error");
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      accepted: { color: "bg-green-100 text-green-800", label: "Accepted" },
      rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      <Sidebar filter={filter} setFilter={setFilter} />

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-[260px] h-screen overflow-y-auto">
        {/* HEADER */}
        <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#2f4156]">
                Booth Vendor Requests
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and review booth applications
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 bg-[#2f4156] text-white rounded-lg hover:bg-[#1f2d3d] transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <Filter size={20} className="text-[#2f4156]" />
            <h2 className="text-lg font-semibold text-[#2f4156]">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* SEARCH */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2f4156] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-8">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2f4156]"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {!loading && !error && filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <Mail size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No booth requests found</p>
              <p className="text-gray-400 mt-2">
                {searchQuery
                  ? "Try adjusting your search"
                  : "No vendors have applied for booths yet"}
              </p>
            </div>
          )}

          {/* VENDOR CARDS GRID */}
          {!loading && !error && filteredRequests.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredRequests.map((req) => (
                <div
                  key={req._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  {/* Header with Status */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {req.name || "Unnamed Vendor"}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 truncate">
                        {req.email}
                      </p>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>

                  {/* Application Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin size={16} className="text-gray-400" />
                      <span className="text-gray-700">
                        <strong>Location:</strong>{" "}
                        {req.location || "Not specified"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <Clock size={16} className="text-gray-400" />
                      <span className="text-gray-700">
                        <strong>Duration:</strong>{" "}
                        {req.duration || "Not specified"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <Ruler size={16} className="text-gray-400" />
                      <span className="text-gray-700">
                        <strong>Size:</strong>{" "}
                        {req.boothSize || "Not specified"}
                      </span>
                    </div>
                  </div>

                  {/* Application ID */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Application ID</p>
                    <p className="text-sm font-mono text-gray-700 truncate">
                      {req._id || "—"}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  {req.status === "pending" && (
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => openConfirm(req._id, "accepted")}
                        disabled={processingId === req._id}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {processingId === req._id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        {processingId === req._id ? "Processing..." : "Accept"}
                      </button>
                      <button
                        onClick={() => openConfirm(req._id, "rejected")}
                        disabled={processingId === req._id}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {processingId === req._id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <XCircle size={16} />
                        )}
                        {processingId === req._id ? "Processing..." : "Reject"}
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
        </div>
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
