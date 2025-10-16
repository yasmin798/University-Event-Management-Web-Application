import React, { useEffect, useState } from "react";

export default function Admin() {
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [vendorBazaarRequests, setVendorBazaarRequests] = useState([]);
  const [vendorBoothRequests, setVendorBoothRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [assignedRoles, setAssignedRoles] = useState({});
  const [showMailPopup, setShowMailPopup] = useState(false);
  const [mailTarget, setMailTarget] = useState(null);
  const [sending, setSending] = useState(false);
  const [previewLink, setPreviewLink] = useState("");

  // Fetch users and vendor requests
  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Users
      const usersRes = await fetch("http://localhost:3000/api/debug/users");
      const usersData = await usersRes.json();
      if (usersData.users) {
        setVerifiedUsers(usersData.users.filter((u) => u.isVerified));
        setPendingUsers(usersData.users.filter((u) => !u.isVerified));
      }

      // Bazaar requests
      const bazaarRes = await fetch(
        "http://localhost:3000/api/admin/bazaar-vendor-requests"
      );
      const bazaarData = await bazaarRes.json();
      setVendorBazaarRequests(bazaarData.requests || []);

      // Booth requests
      const boothRes = await fetch(
        "http://localhost:3000/api/admin/booth-vendor-requests"
      );
      const boothData = await boothRes.json();
      setVendorBoothRequests(boothData.requests || []);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setMessage("❌ Could not load data.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Delete user
  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to DELETE this user?")) return;

    try {
      const res = await fetch(`http://localhost:3000/api/admin/delete/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("🗑️ User deleted successfully!");
        fetchUsers();
      } else {
        setMessage(`❌ ${data.error || "Delete failed"}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error during delete");
    }
  };

  // Send verification mail
  const handleSendMail = async () => {
    if (!mailTarget) return;
    setSending(true);
    try {
      const assignedRole = assignedRoles[mailTarget._id];
      const res = await fetch("http://localhost:3000/api/admin/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: mailTarget.email,
          userId: mailTarget._id,
          role: assignedRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`📧 ${data.message}`);
        setShowMailPopup(false);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Could not send email.");
    }
    setSending(false);
  };

  // Vendor request status
  const handleVendorRequestStatus = async (requestId, type, newStatus) => {
    if (!window.confirm(`Are you sure you want to ${newStatus.toUpperCase()} this ${type} vendor request?`)) return;

    try {
      const res = await fetch(
        `http://localhost:3000/api/admin/${type}-vendor-requests/${requestId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Vendor request ${newStatus} successfully!`);
        fetchUsers();
      } else {
        setMessage(`❌ ${data.error || "Update failed"}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error during request update");
    }
  };

  // Generate preview link
  const generatePreviewLink = (userId) => {
    const token = Math.random().toString(36).substring(2, 15);
    setPreviewLink(`http://localhost:3000/api/verify/${token}-for-${userId}`);
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading users and requests...</p>;

  return (
    <div style={{ padding: "30px", fontFamily: "Poppins, Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "#111827" }}>Admin Dashboard</h1>
      {message && (
        <p
          style={{
            textAlign: "center",
            color: message.startsWith("✅") || message.startsWith("📧") ? "green" : "red",
            fontWeight: 500,
          }}
        >
          {message}
        </p>
      )}

      {/* VERIFIED USERS */}
      <h2 style={{ color: "#10B981", marginTop: 40 }}>✅ Verified Users</h2>
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: "#10B981", color: "white" }}>
            <th style={thStyle}>Name / Company</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Role</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {verifiedUsers.length ? (
            verifiedUsers.map((user) => (
              <tr key={user._id} style={trStyle}>
                <td style={tdStyle}>{user.firstName || user.companyName || "User"}</td>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>{user.role}</td>
                <td style={tdStyle}>
                  <button onClick={() => handleDelete(user._id)} style={deleteBtnStyle}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={tdEmptyStyle}>No verified users yet.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* PENDING USERS */}
      <h2 style={{ color: "#F59E0B", marginTop: 50 }}>🕓 Pending Verification</h2>
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: "#F59E0B", color: "white" }}>
            <th style={thStyle}>Name / Company</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Current Role</th>
            <th style={thStyle}>Assigned Role</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pendingUsers.length ? (
            pendingUsers.map((user) => (
              <tr key={user._id} style={trStyle}>
                <td style={tdStyle}>{user.firstName || user.companyName || "User"}</td>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>{user.role}</td>
                <td style={tdStyle}>
                  <select
                    style={dropdownStyle}
                    value={assignedRoles[user._id] || ""}
                    onChange={(e) => setAssignedRoles({ ...assignedRoles, [user._id]: e.target.value })}
                  >
                    <option value="">Select Role</option>
                    <option value="staff">Staff</option>
                    <option value="ta">TA</option>
                    <option value="professor">Professor</option>
                  </select>
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => {
                      setMailTarget(user);
                      generatePreviewLink(user._id);
                      setShowMailPopup(true);
                    }}
                    style={mailBtnStyle}
                  >
                    Send Mail
                  </button>
                  <button onClick={() => handleDelete(user._id)} style={deleteBtnStyle}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={tdEmptyStyle}>No pending users.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* VENDOR REQUESTS - BAZAARS */}
      <h2 style={{ color: "#3B82F6", marginTop: 50 }}>Vendor Requests - Bazaars</h2>
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: "#3B82F6", color: "white" }}>
            <th style={thStyle}>Bazaar ID</th>
            <th style={thStyle}>Vendor</th>
            <th style={thStyle}>Description</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vendorBazaarRequests.length ? (
            vendorBazaarRequests.map((req) => (
              <tr key={req._id} style={trStyle}>
                <td style={tdStyle}>{req.bazaarId}</td>
                <td style={tdStyle}>{req.vendorName}</td>
                <td style={tdStyle}>{req.description}</td>
                <td style={tdStyle}>{req.status}</td>
                <td style={tdStyle}>
                  {req.status === "pending" && (
                    <>
                      <button onClick={() => handleVendorRequestStatus(req._id, "bazaar", "accepted")} style={verifyBtnStyle}>Accept</button>
                      <button onClick={() => handleVendorRequestStatus(req._id, "bazaar", "rejected")} style={deleteBtnStyle}>Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={tdEmptyStyle}>No bazaar requests.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* VENDOR REQUESTS - BOOTHS */}
      <h2 style={{ color: "#6366F1", marginTop: 50 }}>Vendor Requests - Booths</h2>
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: "#6366F1", color: "white" }}>
            <th style={thStyle}>Booth ID</th>
            <th style={thStyle}>Vendor</th>
            <th style={thStyle}>Description</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vendorBoothRequests.length ? (
            vendorBoothRequests.map((req) => (
              <tr key={req._id} style={trStyle}>
                <td style={tdStyle}>{req.boothId}</td>
                <td style={tdStyle}>{req.vendorName}</td>
                <td style={tdStyle}>{req.description}</td>
                <td style={tdStyle}>{req.status}</td>
                <td style={tdStyle}>
                  {req.status === "pending" && (
                    <>
                      <button onClick={() => handleVendorRequestStatus(req._id, "booth", "accepted")} style={verifyBtnStyle}>Accept</button>
                      <button onClick={() => handleVendorRequestStatus(req._id, "booth", "rejected")} style={deleteBtnStyle}>Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={tdEmptyStyle}>No booth requests.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* MAIL POPUP */}
      {showMailPopup && mailTarget && (
        <div style={popupOverlayStyle}>
          <div style={popupHeaderStyle}>
            <div>
              <h3 style={{ margin: 0 }}>New Message</h3>
              <p style={{ color: "#E5E7EB", fontSize: 14 }}>Admin Compose</p>
            </div>
            <button onClick={() => setShowMailPopup(false)} style={closeBtnStyle}>✕</button>
          </div>
          <div style={popupContentStyle}>
            <div style={mailRowStyle}><b>To:</b> {mailTarget.email}</div>
            <div style={mailRowStyle}><b>Subject:</b> Account Verification - Admin Approval</div>
            <div style={mailBodyStyle}>
              <p>Dear {mailTarget.firstName || "User"},</p>
              <p>Please click the link below to verify your account:</p>
              <a href={previewLink} target="_blank" rel="noreferrer">{previewLink}</a>
              <p>This link will expire once used.</p>
              <p>— Admin Team</p>
            </div>
          </div>
          <div style={popupFooterStyle}>
            <button onClick={handleSendMail} style={sendBtnStyle} disabled={sending}>{sending ? "Sending..." : "Send"}</button>
            <button onClick={() => setShowMailPopup(false)} style={cancelBtnStyle}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Styles ---------- */
const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: 10, backgroundColor: "white", borderRadius: 10, overflow: "hidden" };
const thStyle = { padding: 10, fontWeight: 600, textAlign: "center" };
const tdStyle = { padding: 10, textAlign: "center", borderBottom: "1px solid #E5E7EB" };
const trStyle = { background: "#fff" };
const tdEmptyStyle = { padding: 20, textAlign: "center", color: "#6B7280" };
const verifyBtnStyle = { backgroundColor: "#10B981", color: "white", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", marginRight: 5 };
const deleteBtnStyle = { backgroundColor: "#EF4444", color: "white", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer" };
const mailBtnStyle = { backgroundColor: "#3B82F6", color: "white", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", marginRight: 5 };
const dropdownStyle = { padding: 5, borderRadius: 6, border: "1px solid #D1D5DB", backgroundColor: "#F9FAFB" };

/* Popup styles */
const popupOverlayStyle = { position: "fixed", bottom: 0, right: 20, width: 400, backgroundColor: "white", borderRadius: "10px 10px 0 0", boxShadow: "0 -4px 15px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", zIndex: 999 };
const popupHeaderStyle = { background: "#3B82F6", color: "white", padding: "10px 15px", display: "flex", justifyContent: "space-between", alignItems: "center" };
const closeBtnStyle = { background: "transparent", border: "none", color: "white", fontSize: 18, cursor: "pointer" };
const popupContentStyle = { padding: "10px 15px", flexGrow: 1, overflowY: "auto" };
const mailRowStyle = { padding: "5px 0", borderBottom: "1px solid #E5E7EB", fontSize: 14 };
const mailBodyStyle = { padding: "10px 0", fontSize: 14, color: "#111827" };
const popupFooterStyle = { padding: "10px 15px", borderTop: "1px solid #E5E7EB", display: "flex", justifyContent: "flex-end", gap: 10 };
const sendBtnStyle = { backgroundColor: "#10B981", color: "white", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontWeight: 500 };
const cancelBtnStyle = { backgroundColor: "#9CA3AF", color: "white", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer" };
