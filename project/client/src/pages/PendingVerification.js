import React, { useEffect, useState } from "react";
import FixedSidebarAdmin from "../components/FixedSidebarAdmin";
import { Mail, Trash2 } from "lucide-react";

export default function PendingVerificationPage() {
  const API_ORIGIN = "http://localhost:3001";

  const [pendingUsers, setPendingUsers] = useState([]);
  const [assignedRoles, setAssignedRoles] = useState({});
  const [message, setMessage] = useState("");
  const [showMailPopup, setShowMailPopup] = useState(false);
  const [mailTarget, setMailTarget] = useState(null);
  const [previewLink, setPreviewLink] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await fetch(`${API_ORIGIN}/api/debug/users`);
      const data = await res.json();
      if (data.users) {
        setPendingUsers(data.users.filter((u) => !u.isVerified));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to DELETE this user?")) return;

    try {
      const res = await fetch(`${API_ORIGIN}/api/admin/delete/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("🗑️ User deleted successfully!");
        fetchPending();
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      setMessage("❌ Server error");
    }
  };

  const handleBlock = async (userId, status) => {
    const newStatus = status === "blocked" ? "active" : "blocked";

    if (!window.confirm(`Are you sure you want to ${newStatus} this user?`))
      return;

    try {
      const res = await fetch(`${API_ORIGIN}/api/admin/block/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        fetchPending();
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      setMessage("❌ Server error");
    }
  };
  const generatePreviewLink = (userId) => {
    const token = Math.random().toString(36).substring(2, 15);
    setPreviewLink(`${API_ORIGIN}/api/verify/${token}-for-${userId}`);
  };

  const handleSendMail = async () => {
    if (!mailTarget) return;
    setSending(true);

    // VALIDATION
    if (mailTarget.role !== "student" && !assignedRoles[mailTarget._id]) {
      setMessage("❌ Please assign a role before sending email.");
      setSending(false);
      return;
    }

    try {
      let assignedRole = assignedRoles[mailTarget._id];
      if (mailTarget.role === "student") {
        assignedRole = "student";
      }

      const res = await fetch(`${API_ORIGIN}/api/admin/send-verification`, {
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
      setMessage("❌ Could not send mail.");
    }

    setSending(false);
  };

  return (
    <div className="flex h-screen bg-[#f5efeb]">
      <FixedSidebarAdmin />

      <div className="flex-1 overflow-auto" style={{ marginLeft: "260px" }}>
        <header className="bg-white border-b px-8 py-4">
          <h1 className="text-xl font-bold text-[#2f4156]">
            Pending Verification
          </h1>
        </header>

        <main className="p-8">
          {message && (
            <p
              style={{
                textAlign: "center",
                color: message.startsWith("❌") ? "red" : "green",
                fontWeight: 500,
              }}
            >
              {message}
            </p>
          )}

          <table
            style={{
              width: "100%", // bigger width
              maxWidth: "1400px", // allow a wider table
              margin: "25px auto", // centered + more spacing
              borderCollapse: "collapse",
              backgroundColor: "white",
              borderRadius: 12,
              overflow: "hidden",
              fontSize: 20, // slightly bigger font
            }}
          >
            <thead>
              <tr style={{ background: "#F59E0B", color: "white" }}>
                <th style={th}>Name</th>
                <th style={th}>Email</th>
                <th style={th}>Role</th>
                <th style={th}>ID</th>
                <th style={th}>Assigned Role</th>
                <th style={th}>Status</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {pendingUsers.length ? (
                pendingUsers.map((u) => (
                  <tr key={u._id} style={row}>
                    <td style={td}>{u.firstName || u.companyName || "User"}</td>
                    <td style={td}>{u.email}</td>
                    <td style={td}>{u.role}</td>
                    <td style={td}>
                      {u.roleSpecificId || (
                        <span style={{ color: "#6B7280", fontStyle: "italic" }}>
                          N/A
                        </span>
                      )}
                    </td>

                    <td style={td}>
                      {u.role === "student" ? (
                        <strong>Student</strong>
                      ) : (
                        <select
                          value={assignedRoles[u._id] || ""}
                          onChange={(e) =>
                            setAssignedRoles({
                              ...assignedRoles,
                              [u._id]: e.target.value,
                            })
                          }
                          style={{
                            padding: 5,
                            borderRadius: 6,
                            border: "1px solid #D1D5DB",
                            backgroundColor: "#F9FAFB",
                          }}
                        >
                          <option value="">Select Role</option>
                          <option value="ta">TA</option>
                          <option value="staff">Staff</option>
                          <option value="professor">Professor</option>
                        </select>
                      )}
                    </td>

                    <td style={td}>
                      <span
                        style={{
                          color: u.status === "blocked" ? "red" : "green",
                          fontWeight: 600,
                        }}
                      >
                        {u.status || "active"}
                      </span>
                    </td>

                    <td style={td}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "nowrap",
                        }}
                      >
                        {/* BLOCK / UNBLOCK */}
                        <button
                          onClick={() => handleBlock(u._id, u.status)}
                          style={{
                            background:
                              u.status === "blocked" ? "#10B981" : "#EF4444",
                            color: "white",
                            borderRadius: 6,
                            padding: "6px 10px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          {u.status === "blocked" ? "Unblock" : "Block"}
                        </button>

                        {/* SEND MAIL */}
                        <button
                          onClick={() => {
                            setMailTarget(u);
                            generatePreviewLink(u._id);
                            setShowMailPopup(true);
                          }}
                          style={{
                            background: "#3B82F6",
                            color: "white",
                            borderRadius: 6,
                            padding: "6px 10px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <span>Send Mail</span>
                        </button>

                        {/* DELETE */}
                        <button
                          onClick={() => handleDelete(u._id)}
                          style={{
                            background: "#EF4444",
                            color: "white",
                            borderRadius: 6,
                            padding: "6px 10px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      padding: 20,
                      textAlign: "center",
                      color: "#6B7280",
                    }}
                  >
                    No pending users.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {showMailPopup && mailTarget && (
            <div
              style={{
                position: "fixed",
                bottom: 0,
                right: 20,
                width: 400,
                backgroundColor: "white",
                borderRadius: "10px 10px 0 0",
                boxShadow: "0 -4px 15px rgba(0,0,0,0.2)",
                zIndex: 999,
                padding: 15,
              }}
            >
              <h3 style={{ margin: 0, fontWeight: 600 }}>Verify Account</h3>
              <p style={{ marginTop: 5 }}>To: {mailTarget.email}</p>
              <p>
                <strong>Preview Link:</strong>
                <br />
                <a href={previewLink} target="_blank" rel="noreferrer">
                  {previewLink}
                </a>
              </p>

              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
              >
                <button
                  onClick={handleSendMail}
                  style={{
                    background: "#10B981",
                    color: "white",
                    padding: "8px 12px",
                    borderRadius: 6,
                  }}
                >
                  {sending ? "Sending..." : "Send"}
                </button>

                <button
                  onClick={() => setShowMailPopup(false)}
                  style={{
                    background: "#9CA3AF",
                    color: "white",
                    padding: "8px 12px",
                    borderRadius: 6,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const th = {
  padding: 10,
  fontWeight: 600,
  textAlign: "center",
  fontSize: 14,
};

const td = {
  padding: 10,
  textAlign: "center",
  borderBottom: "1px solid #E5E7EB",
  fontSize: 14,
};

const row = { background: "#fff" };
const actionBtnBase = {
  borderRadius: 6,
  padding: "6px 10px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  border: "none",
  cursor: "pointer",
  fontSize: 12,
  minWidth: 90, // 👈 same width for Block / Send Mail / Delete
  whiteSpace: "nowrap",
};
