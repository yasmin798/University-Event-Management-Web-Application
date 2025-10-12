import React, { useEffect, useState } from "react";

export default function Admin() {
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [assignedRoles, setAssignedRoles] = useState({}); // store selected roles

  // ✅ Fetch all users
  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/debug/users");
      const data = await res.json();

      if (data.users) {
        setVerifiedUsers(data.users.filter((u) => u.isVerified));
        setPendingUsers(data.users.filter((u) => !u.isVerified));
      }
      setLoading(false);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setMessage("❌ Could not load users.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✅ Verify user (with confirmation + assigned role)
  const handleVerify = async (userId) => {
    const confirm = window.confirm("Are you sure you want to VERIFY this user?");
    if (!confirm) return;

    const assignedRole = assignedRoles[userId];
    if (!assignedRole) {
      alert("⚠️ Please select an Assigned Role before verifying.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/api/admin/verify/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: assignedRole }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`✅ ${assignedRole} verified successfully!`);
        fetchUsers(); // refresh lists
      } else {
        setMessage(`❌ ${data.error || "Verification failed"}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error during verification");
    }
  };

  // ✅ Delete user (with confirmation)
  const handleDelete = async (userId) => {
    const confirm = window.confirm("Are you sure you want to DELETE this user?");
    if (!confirm) return;

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

  if (loading) return <p style={{ textAlign: "center" }}>Loading users...</p>;

  return (
    <div style={{ padding: "30px", fontFamily: "Poppins, Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "#111827" }}>Admin Dashboard</h1>

      {message && (
        <p
          style={{
            textAlign: "center",
            color: message.startsWith("✅") ? "green" : "red",
            fontWeight: "500",
          }}
        >
          {message}
        </p>
      )}

      {/* ✅ VERIFIED USERS */}
      <h2 style={{ color: "#10B981", marginTop: "40px" }}>✅ Verified Users</h2>
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
          {verifiedUsers.length > 0 ? (
            verifiedUsers.map((user) => (
              <tr key={user._id} style={trStyle}>
                <td style={tdStyle}>
                  {user.role === "vendor"
                    ? user.firstName || user.companyName || "Vendor"
                    : `${user.firstName} ${user.lastName}`}
                </td>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>{user.role}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleDelete(user._id)}
                    style={deleteBtnStyle}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={tdEmptyStyle}>
                No verified users yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 🕓 PENDING USERS */}
      <h2 style={{ color: "#F59E0B", marginTop: "50px" }}>🕓 Pending Verification</h2>
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
          {pendingUsers.length > 0 ? (
            pendingUsers.map((user) => (
              <tr key={user._id} style={trStyle}>
                <td style={tdStyle}>
                  {user.role === "vendor"
                    ? user.firstName || user.companyName || "Vendor"
                    : `${user.firstName} ${user.lastName}`}
                </td>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>{user.role}</td>
                <td style={tdStyle}>
                  <select
                    style={dropdownStyle}
                    value={assignedRoles[user._id] || ""}
                    onChange={(e) =>
                      setAssignedRoles({
                        ...assignedRoles,
                        [user._id]: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Role</option>
                    <option value="staff">Staff</option>
                    <option value="ta">TA</option>
                    <option value="professor">Professor</option>
                  </select>
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleVerify(user._id)}
                    style={verifyBtnStyle}
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => handleDelete(user._id)}
                    style={deleteBtnStyle}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={tdEmptyStyle}>
                No pending users.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Styles ---------- */
const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "10px",
  backgroundColor: "white",
  borderRadius: "10px",
  overflow: "hidden",
};
const thStyle = {
  padding: "10px",
  fontWeight: "600",
  textAlign: "center",
};
const tdStyle = {
  padding: "10px",
  textAlign: "center",
  borderBottom: "1px solid #E5E7EB",
};
const trStyle = { background: "#fff" };
const tdEmptyStyle = {
  padding: "20px",
  textAlign: "center",
  color: "#6B7280",
};
const verifyBtnStyle = {
  backgroundColor: "#10B981",
  color: "white",
  border: "none",
  borderRadius: "6px",
  padding: "6px 10px",
  cursor: "pointer",
  marginRight: "5px",
};
const deleteBtnStyle = {
  backgroundColor: "#EF4444",
  color: "white",
  border: "none",
  borderRadius: "6px",
  padding: "6px 10px",
  cursor: "pointer",
};
const dropdownStyle = {
  padding: "5px",
  borderRadius: "6px",
  border: "1px solid #D1D5DB",
  backgroundColor: "#F9FAFB",
};
