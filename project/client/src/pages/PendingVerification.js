import React, { useEffect, useState } from "react";
import FixedSidebarAdmin from "../components/FixedSidebarAdmin";
import { Mail, Trash2 } from "lucide-react";

export default function PendingVerificationPage() {
  const API_ORIGIN = "http://localhost:3001";

  const [pendingUsers, setPendingUsers] = useState([]);
  const [assignedRoles, setAssignedRoles] = useState({});
  const [message, setMessage] = useState("");

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
              width: "100%",
              borderCollapse: "collapse",
              marginTop: 10,
              backgroundColor: "white",
              borderRadius: 10,
              overflow: "hidden",
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
                      <button
                        onClick={() => handleBlock(u._id, u.status)}
                        style={{
                          background:
                            u.status === "blocked" ? "#10B981" : "#EF4444",
                          color: "white",
                          borderRadius: 6,
                          padding: "6px 10px",
                          marginRight: 5,
                        }}
                      >
                        {u.status === "blocked" ? "Unblock" : "Block"}
                      </button>

                      <button
                        onClick={() => handleDelete(u._id)}
                        style={{
                          background: "#EF4444",
                          color: "white",
                          borderRadius: 6,
                          padding: "6px 10px",
                        }}
                      >
                        Delete
                      </button>
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
        </main>
      </div>
    </div>
  );
}

const th = { padding: 10, fontWeight: 600, textAlign: "center" };
const td = {
  padding: 10,
  textAlign: "center",
  borderBottom: "1px solid #E5E7EB",
};
const row = { background: "#fff" };
