// client/src/pages/AdminVendor.jsx
import React, { useEffect, useState } from "react";
import FixedSidebarAdmin from "../components/FixedSidebarAdmin";
import { Menu } from "lucide-react";
import { User } from "lucide-react";
import NotificationsDropdown from "../components/NotificationsDropdown"; // ✅ ADD THIS

export default function AdminVendor() {
  const API_ORIGIN = "http://localhost:3001";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const totalPages = Math.max(1, Math.ceil(requests.length / pageSize));
  const paginated = requests.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_ORIGIN}/api/bazaar-applications`);
      const data = await res.json();

      let list = Array.isArray(data) ? data : data.requests || [];

      const normalized = list.map((r) => ({
        id: r._id,
        boothId: r._id,
        vendor: r.vendorName || r.attendees?.[0]?.name || "—",
        description: `Booth: ${r.boothSize || "N/A"} • Location: ${
          r.platformSlot || "—"
        } • Duration: ${r.durationWeeks || "—"} weeks`,
        vendorDescription: r.vendorDescription || "", // ✅ NEW: what they do / offer
        status: r.status || "pending",
      }));

      setRequests(normalized);
    } catch (err) {
      console.error("Error fetching vendor requests:", err);
    }
    setLoading(false);
  };

  const updateStatus = async (id, newStatus) => {
    if (!window.confirm(`Are you sure you want to ${newStatus} this request?`))
      return;

    setProcessingId(id);

    try {
      const res = await fetch(`${API_ORIGIN}/api/bazaar-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchRequests();
      } else {
        alert("Failed to update request");
      }
    } catch (err) {
      alert("Network error");
    }

    setProcessingId(null);
  };

  return (
    <div className="flex h-screen bg-[#f5efeb]">
      <FixedSidebarAdmin />

     <div className="flex-1 overflow-auto" style={{ marginLeft: "260px" }}>
        <header className="bg-white border-b border-[#c8d9e6] px-6 py-4">
          {/* ✅ make header left + right */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-[#2f4156]">
                Vendor Requests — Bazaars
              </h1>
            </div>

            {/* ✅ Notification bell & user */}
            <div className="flex items-center gap-2 md:gap-4 ml-4">
              <div>
                <NotificationsDropdown />
              </div>
              <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center">
                <User size={20} className="text-[#2f4156]" />
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          {loading ? (
            <p>Loading requests…</p>
          ) : (
            <>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  background: "white",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <thead>
                  <tr style={{ background: "#3B82F6", color: "white" }}>
                    <th style={thStyle}>Booth ID</th>
                    <th style={thStyle}>Vendor</th>
                    <th style={thStyle}>Description (location & duration)</th>
                    <th style={thStyle}>Vendor Description</th> {/* ✅ NEW COLUMN */}
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginated.length ? (
                    paginated.map((req) => (
                      <tr key={req.id} style={trStyle}>
                        <td style={tdStyle}>{req.boothId}</td>

                        <td style={tdStyle}>{req.vendor}</td>

                        <td style={tdStyle}>{req.description}</td>

                        {/* ✅ SHOW VENDOR DESCRIPTION */}
                        <td style={tdStyle}>
                          {req.vendorDescription && req.vendorDescription.trim()
                            ? req.vendorDescription
                            : "—"}
                        </td>

                        <td style={tdStyle}>
                          <span
                            style={{
                              fontWeight: 700,
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
                        </td>

                        <td style={tdStyle}>
                          {req.status === "pending" ? (
                            <>
                              <button
                                onClick={() => updateStatus(req.id, "accepted")}
                                style={acceptBtn}
                                disabled={processingId === req.id}
                              >
                                {processingId === req.id ? "..." : "Accept"}
                              </button>

                              <button
                                onClick={() => updateStatus(req.id, "rejected")}
                                style={rejectBtn}
                                disabled={processingId === req.id}
                              >
                                {processingId === req.id ? "..." : "Reject"}
                              </button>
                            </>
                          ) : (
                            <i>—</i>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={emptyStyle}>
                        {/* 5 → 6 because we added a column */}
                        No vendor requests.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div
                className="flex justify-center items-center gap-4 mt-2
"
              >
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50"
                >
                  Prev
                </button>

                <span className="font-medium text-[#2f4156]">
                  Page {page} / {totalPages}
                </span>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

const thStyle = { padding: 12, fontWeight: 600, textAlign: "center" };
const trStyle = { background: "white" };
const tdStyle = {
  padding: 12,
  textAlign: "center",
  borderBottom: "1px solid #e5e7eb",
};
const emptyStyle = {
  padding: 20,
  textAlign: "center",
  color: "#6B7280",
};
const acceptBtn = {
  backgroundColor: "#10B981",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "6px 10px",
  cursor: "pointer",
  marginRight: 5,
};
const rejectBtn = {
  backgroundColor: "#EF4444",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "6px 10px",
  cursor: "pointer",
};
