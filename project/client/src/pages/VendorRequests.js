// client/src/pages/VendorRequests.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import NotificationsDropdown from "../components/NotificationsDropdown";

import {
  Search,
  Filter,
  Mail,
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
  MapPin,
  Calendar,
  Mic,
} from "lucide-react";
import "../events.theme.css";
import Sidebar from "../components/Sidebar";

function ConfirmModal({ open, title, body, onCancel, onConfirm }) {
  if (!open) return null;

  const isAccept = title.toLowerCase().includes("accept");

  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="confirm">
        <h2>{title}</h2>
        <p>{body}</p>
        <div className="confirm-actions">
          <button
            className="btn btn-outline"
            onClick={onCancel}
            style={{
              backgroundColor: "#9CA3AF",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "8px 16px",
              cursor: "pointer",
              marginRight: "8px",
            }}
          >
            Cancel
          </button>
          <button
            className="btn"
            onClick={onConfirm}
            style={{
              backgroundColor: isAccept ? "#10B981" : "#EF4444",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "8px 16px",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            {isAccept ? "Accept" : "Reject"}
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
  if (vendorTarget.type === "bazaar") {
    detailsString = `Bazaar Title: ${
      vendorTarget.details.bazaarTitle || "N/A"
    }\nLocation: ${vendorTarget.details.location || "N/A"}\nStart: ${
      vendorTarget.details.start || "N/A"
    }\nEnd: ${vendorTarget.details.end || "N/A"}\nBooth Size: ${
      vendorTarget.details.boothSize || "N/A"
    }`;
  }

  const defaultSubject = `Your ${typeCapitalized} Vendor Request Has Been ${
    isAccepted ? "Accepted" : "Rejected"
  }`;
  const defaultBody = `Dear ${vendorTarget.vendorName},\n\nYour ${
    vendorTarget.type
  } vendor request has been ${
    vendorTarget.newStatus
  } by the admin.\n\nDetails:\n${detailsString}\n\n${
    isAccepted
      ? "We look forward to your participation!"
      : "If you have any questions, please contact support."
  }\n\n— Admin Team`;

  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);

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
        <div
          style={{
            ...mailRowStyle,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <b>Subject:</b>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{
              flex: 1,
              border: "1px solid #E5E7EB",
              borderRadius: 6,
              padding: "6px 8px",
            }}
          />
        </div>
        <div style={mailBodyStyle}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            style={{
              width: "100%",
              border: "1px solid #E5E7EB",
              borderRadius: 6,
              padding: 10,
              fontSize: 14,
              fontFamily: "inherit",
              color: "#111827",
              resize: "vertical",
            }}
          />
        </div>
      </div>
      <div style={popupFooterStyle}>
        <button
          onClick={() => onSend(subject, body)}
          style={sendBtnStyle}
          disabled={sending}
        >
          {sending ? "Sending..." : "Send"}
        </button>
        <button onClick={onClose} style={cancelBtnStyle}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function QRCodePopup({ onClose, onSend, sending, vendorTarget }) {
  const attendeeCount = vendorTarget.raw.attendees?.length || 0;

  return (
    <div style={popupOverlayStyle}>
      <div style={popupHeaderStyle}>
        <div>
          <h3 style={{ margin: 0 }}>Send QR Codes</h3>
          <p style={{ color: "#E5E7EB", fontSize: 14 }}>
            QR Code Distribution to Vendor
          </p>
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
          <b>Subject:</b> QR Codes for Your Bazaar Vendor Application
        </div>
        <div style={mailBodyStyle}>
          <p>Dear {vendorTarget.vendorName},</p>
          <p>
            Please find attached a PDF containing QR codes for all attendees
            associated with your bazaar vendor application.
          </p>
          <p>
            This document contains {attendeeCount} individual QR codes, one for
            each attendee registered under your application.
          </p>
          <p>
            These QR codes are required for attendee check-in and verification
            during the event. Please ensure each attendee has their respective
            QR code available.
          </p>
          <p>
            If you have any questions about the QR codes or attendee management,
            please contact the admin team.
          </p>
          <p>— Event Administration Team</p>
        </div>
      </div>
      <div style={popupFooterStyle}>
        <button onClick={onSend} style={sendBtnStyle} disabled={sending}>
          {sending ? "Sending QR Codes..." : "Send QR Codes"}
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState({
    requestId: null,
    newStatus: null,
    title: "",
    body: "",
  });
  const [sendingQRCodes, setSendingQRCodes] = useState(false);
  const [showQRCodePopup, setShowQRCodePopup] = useState(false);
  const [qrCodeTarget, setQrCodeTarget] = useState(null);
  const [showVendorMailPopup, setShowVendorMailPopup] = useState(false);
  const [vendorTarget, setVendorTarget] = useState(null);
  const [sending, setSending] = useState(false);
  const API_ORIGIN = "http://localhost:3001";

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const firstAtt = Array.isArray(req.attendees) ? req.attendees[0] : null;
    const vendorName = req.vendorName || firstAtt?.name || "Unknown Vendor";
    const vendorEmail = req.vendorEmail || firstAtt?.email || "No email";

    const matchesSearch =
      vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendorEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (req.status || "pending").toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

  const handleSendVendorMail = async (subject, body) => {
    if (!vendorTarget) return;
    setSending(true);
    setProcessingId(vendorTarget.requestId);
    try {
      await updateStatusOnServer(
        vendorTarget.requestId,
        vendorTarget.newStatus
      );
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
            subject,
            body,
            vendorName: vendorTarget.vendorName,
          }),
        }
      );
      const mailData = await mailRes.json();
      if (mailRes.ok) {
        setRequests((prev) =>
          prev.map((r) =>
            r._id === vendorTarget.requestId
              ? { ...r, status: vendorTarget.newStatus }
              : r
          )
        );
        alert(
          `✅ Vendor request ${vendorTarget.newStatus} and notification sent successfully!`
        );
      } else {
        alert(
          `✅ Vendor request ${vendorTarget.newStatus}, but email failed: ${
            mailData.error || "Unknown error"
          }`
        );
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

  const handleSendQRCodes = async () => {
    if (!qrCodeTarget) return;

    setSendingQRCodes(true);

    try {
      const response = await fetch(
        `${API_ORIGIN}/api/bazaar-applications/admin/send-qr-codes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            boothId: qrCodeTarget.raw._id,
            vendorEmail: qrCodeTarget.vendorEmail,
            vendorName: qrCodeTarget.vendorName,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        alert(
          `QR codes have been successfully sent to ${qrCodeTarget.vendorEmail}`
        );
      } else {
        throw new Error(result.error || "Failed to send QR codes");
      }
    } catch (err) {
      console.error("Error sending QR codes:", err);
      alert(`Failed to send QR codes: ${err.message}`);
    } finally {
      setSendingQRCodes(false);
      setShowQRCodePopup(false);
      setQrCodeTarget(null);
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
                Vendor Participation Requests
              </h1>
              <p className="text-gray-600 mt-1">
                Manage vendor applications for this bazaar
              </p>
            </div>
           
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // Voice command can be implemented later
                  console.log("Voice command clicked");
                }}
                style={{
                  background: "#567c8d",
                  color: "white",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.background = "#45687a")}
                onMouseLeave={(e) => (e.target.style.background = "#567c8d")}
              >
                <Mic size={16} />
                Voice Command
              </button>
              <button
                onClick={fetchRequests}
                className="flex items-center gap-2 px-4 py-2 bg-[#2f4156] text-white rounded-lg hover:bg-[#1f2d3d] transition-colors"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              {/* Notifications Dropdown */}
      <NotificationsDropdown />
            </div>
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

            {/* STATUS FILTER */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2f4156] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2f4156]"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <Mail size={48} className="mx-auto text-red-400 mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                No Vendor Requests
              </h3>
              <p className="text-red-600">{error}</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <Filter size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Requests Found
              </h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No vendors have applied for this bazaar yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredRequests.map((req) => {
                const firstAtt = Array.isArray(req.attendees)
                  ? req.attendees[0]
                  : null;
                const vendorName =
                  req.vendorName || firstAtt?.name || "Unknown Vendor";
                const vendorEmail =
                  req.vendorEmail || firstAtt?.email || "No email";
                const boothSize = req.boothSize || "N/A";

                const attendeesList = Array.isArray(req.attendees)
                  ? req.attendees
                      .map((a) => `${a.name} <${a.email}>`)
                      .join(", ")
                  : "";

                const description =
                  req.description ||
                  (boothSize
                    ? `Booth: ${boothSize}. Attendees: ${attendeesList}`
                    : "No description");

                const status = (req.status || "pending").toLowerCase();

                // ✅ NEW: vendor description from DB
                const vendorDescription =
                  req.vendorDescription && req.vendorDescription.trim()
                    ? req.vendorDescription
                    : "";

                return (
                  <div
                    key={req._id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    {/* Header with Status */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 truncate">
                            {vendorName}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {vendorEmail}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(status)}
                    </div>

                    {/* ✅ Vendor Description block */}
                    {vendorDescription && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-500 mb-1">
                          Vendor Description
                        </p>
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {vendorDescription}
                        </p>
                      </div>
                    )}

                    {/* Description */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {description}
                      </p>
                    </div>

                    {/* Booth Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={14} />
                        <span>Booth Size: {boothSize}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} />
                        <span>
                          Attendees:{" "}
                          {Array.isArray(req.attendees)
                            ? req.attendees.length
                            : 0}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {status === "pending" && (
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
                          {processingId === req._id
                            ? "Processing..."
                            : "Accept"}
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
                          {processingId === req._id
                            ? "Processing..."
                            : "Reject"}
                        </button>
                      </div>
                    )}
                    {status === "accepted" &&
                      Array.isArray(req.attendees) &&
                      req.attendees.length > 0 && (
                        <button
                          onClick={() => {
                            setQrCodeTarget({
                              raw: req,
                              vendorEmail:
                                req.vendorEmail || req.attendees[0]?.email,
                              vendorName:
                                req.vendorName || req.attendees[0]?.name,
                            });
                            setShowQRCodePopup(true);
                          }}
                          disabled={sendingQRCodes}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <div className="w-4 h-4 bg-white rounded-sm flex items-center justify-center">
                            <span style={{ fontSize: 10 }}>QR</span>
                          </div>
                          {sendingQRCodes
                            ? "Sending QR Codes..."
                            : "Send QR Codes"}
                        </button>
                      )}
                  </div>
                );
              })}
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
                vendorName:
                  req.vendorName || req.attendees?.[0]?.name || "Vendor",
                vendorEmail: req.vendorEmail || req.attendees?.[0]?.email || "",
                details,
              });
              setShowVendorMailPopup(true);
            }}
          />
          {showQRCodePopup && qrCodeTarget && (
            <QRCodePopup
              onClose={() => setShowQRCodePopup(false)}
              onSend={handleSendQRCodes}
              sending={sendingQRCodes}
              vendorTarget={qrCodeTarget}
            />
          )}
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
