// client/src/pages/VerifiedUsers.jsx

import React, { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import FixedSidebarAdmin from "../components/FixedSidebarAdmin";

export default function VerifiedUsersPage() {
  const API_ORIGIN = "http://localhost:3001";

  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10; // you can change this

  // ===== Fetch Verified Users =====
  const fetchVerified = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_ORIGIN}/api/debug/users`);
      const data = await res.json();

      if (data.users) {
        setVerifiedUsers(data.users.filter((u) => u.isVerified));
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to load users");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerified();
  }, []);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = verifiedUsers.slice(indexOfFirstUser, indexOfLastUser);

  const totalPages = Math.ceil(verifiedUsers.length / usersPerPage);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // ===== Actions =====
  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to DELETE this user?")) return;
    try {
      const res = await fetch(`${API_ORIGIN}/api/admin/delete/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessage("🗑️ User deleted");
        fetchVerified();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBlock = async (userId, currentStatus) => {
    const newStatus = currentStatus === "blocked" ? "active" : "blocked";
    if (!window.confirm(`Are you sure you want to ${newStatus}?`)) return;

    try {
      const res = await fetch(`${API_ORIGIN}/api/admin/block/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setMessage("Status updated");
        fetchVerified();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading…</p>;

  return (
    <div className="flex h-screen bg-[#f5efeb]">
      <FixedSidebarAdmin />

      <div className="flex-1 overflow-auto" style={{ marginLeft: "260px" }}>
        {/* Header */}
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-[#f5efeb] rounded-lg">
              <Menu size={24} className="text-[#2f4156]" />
            </button>
            <h1 className="text-xl font-bold text-[#2f4156]">Verified Users</h1>
          </div>
        </header>

        <main className="p-6">
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

          <h2 style={{ color: "#10B981", marginTop: 10 }}>Verified Users</h2>

          <table style={tableStyle}>
            <thead>
              <tr style={{ background: "#10B981", color: "white" }}>
                <th style={thStyle}>Name / Company</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {verifiedUsers.length ? (
                currentUsers.map((user) => (
                  <tr key={user._id} style={trStyle}>
                    <td style={tdStyle}>
                      {user.firstName || user.companyName || "User"}
                    </td>
                    <td style={tdStyle}>{user.email}</td>
                    <td style={tdStyle}>{user.role}</td>
                    <td style={tdStyle}>{user.roleSpecificId || "N/A"}</td>

                    <td style={tdStyle}>
                      <span
                        style={{
                          color: user.status === "blocked" ? "red" : "green",
                          fontWeight: "bold",
                        }}
                      >
                        {user.status || "active"}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      <button
                        onClick={() =>
                          handleBlock(user._id, user.status || "active")
                        }
                        style={{
                          ...verifyBtnStyle,
                          backgroundColor:
                            user.status === "blocked" ? "#10B981" : "#EF4444",
                        }}
                      >
                        {user.status === "blocked" ? "Unblock" : "Block"}
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
                  <td colSpan="6" style={tdEmptyStyle}>
                    No verified users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </main>
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => goToPage(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Same Styles =====
const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 10,
  backgroundColor: "white",
  borderRadius: 10,
};

const thStyle = {
  padding: 10,
  fontWeight: 600,
  textAlign: "center",
};

const tdStyle = {
  padding: 10,
  textAlign: "center",
  borderBottom: "1px solid #E5E7EB",
};

const trStyle = { background: "#fff" };

const tdEmptyStyle = { padding: 20, textAlign: "center", color: "#6B7280" };

const verifyBtnStyle = {
  backgroundColor: "#10B981",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "6px 10px",
  cursor: "pointer",
  marginRight: 5,
};

const deleteBtnStyle = {
  backgroundColor: "#EF4444",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "6px 10px",
  cursor: "pointer",
};
