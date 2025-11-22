import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, LogOut, Search } from "lucide-react";
import "../events.theme.css";

const API_ORIGIN =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:3001";

export default function AdminSalesReport() {
  const navigate = useNavigate();
  const [data, setData] = useState({ totalRevenue: 0, breakdown: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({
    eventType: "",
    eventName: "",
    startDate: "",
    endDate: "",
  });
  const [sort, setSort] = useState("");

  const fetchSales = async (params = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams(params).toString();
      const url = `${API_ORIGIN}/api/reports/sales${query ? `?${query}` : ""}`;
      const token = localStorage.getItem("token");
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        throw new Error(`${res.status} ${txt || res.statusText}`);
      }
      const reportData = await res.json();
      setData(reportData);
      setError(null);
    } catch (err) {
      console.error("Sales report error", err);
      setError(err?.message || "Failed to load sales report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (filters.eventName.trim() === "") {
        fetchSales();
        return;
      }
      fetchSales({ eventName: filters.eventName });
    }, 400);

    return () => clearTimeout(delay);
  }, [filters.eventName]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      navigate("/");
    }
  };

  return (
    <div className="flex h-screen bg-[#f5efeb]">
      {/* Overlay for Sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#2f4156] text-white flex flex-col transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#567c8d] rounded-full" />
            <span className="text-xl font-bold">EventHub</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-[#567c8d] rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-[#c88585] hover:bg-[#b87575] text-white py-3 px-4 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>

        <nav className="flex-1 px-4">
          <div className="mt-4">
            <button
              onClick={() => navigate("/admin")}
              className="w-full text-left bg-transparent text-white py-2 px-3 rounded hover:bg-[#3b4f63] mb-2"
            >
              Admin Dashboard
            </button>
            <button
              onClick={() => navigate("/admin/attendees-report")}
              className="w-full text-left bg-transparent text-white py-2 px-3 rounded hover:bg-[#3b4f63] mb-2"
            >
              Attendees Report
            </button>
            <button
              onClick={() => navigate("/admin/sales-report")}
              className="w-full text-left bg-transparent text-white py-2 px-3 rounded hover:bg-[#3b4f63] font-semibold"
            >
              Sales Report
            </button>
          </div>
        </nav>
      </div>

      {/* Main Section */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors"
              >
                <Menu size={24} className="text-[#2f4156]" />
              </button>
              <h1 className="text-xl font-bold text-[#2f4156]">Sales Report</h1>
            </div>
          </div>
        </header>

        <main
          style={{
            flex: 1,
            padding: "0px",
          }}
        >
          {/* TOP CARD: SEARCH + FILTERS */}
          <div
            className="bg-white rounded-xl shadow-sm border border-gray-200"
            style={{
              marginTop: 0,
              padding: "20px 24px",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              {/* SEARCH BAR */}
              <div style={{ position: "relative", flex: "1 1 260px" }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "10px",
                    transform: "translateY(-50%)",
                    color: "var(--teal)",
                  }}
                />

                <input
                  type="text"
                  placeholder="Search by event name"
                  value={filters.eventName}
                  onChange={(e) =>
                    setFilters((s) => ({ ...s, eventName: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px 8px 34px",
                    borderRadius: "10px",
                    border: "1px solid rgba(47,65,86,0.2)",
                    fontSize: "13px",
                  }}
                />
              </div>

              {/* EVENT TYPE DROPDOWN */}
              <select
                value={filters.eventType}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, eventType: e.target.value }))
                }
                style={{
                  padding: "10px 14px",
                  borderRadius: "12px",
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  minWidth: "140px",
                  fontSize: "14px",
                }}
              >
                <option value="">All Types</option>
                <option value="workshop">Workshop</option>
                <option value="bazaar">Bazaar</option>
                <option value="trip">Trip</option>
                <option value="conference">Conference</option>
                <option value="gymsession">Gym Session</option>
              </select>

              {/* FROM DATE */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: "12px",
                  background: "#fff",
                  minWidth: "160px",
                }}
              >
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((s) => ({ ...s, startDate: e.target.value }))
                  }
                  style={{
                    border: "none",
                    outline: "none",
                    fontSize: "14px",
                    width: "100%",
                  }}
                />
              </div>

              {/* TO DATE */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: "12px",
                  background: "#fff",
                  minWidth: "160px",
                }}
              >
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((s) => ({ ...s, endDate: e.target.value }))
                  }
                  style={{
                    border: "none",
                    outline: "none",
                    fontSize: "14px",
                    width: "100%",
                  }}
                />
              </div>

              {/* SORT DROPDOWN */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: "12px",
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  minWidth: "160px",
                  fontSize: "14px",
                }}
              >
                <option value="">Sort: none</option>
                <option value="revenue_asc">Revenue: Low → High</option>
                <option value="revenue_desc">Revenue: High → Low</option>
              </select>

              {/* APPLY BUTTON */}
              <button
                className="btn"
                onClick={() => {
                  const params = {};
                  if (filters.eventType) params.eventType = filters.eventType;
                  if (filters.eventName) params.eventName = filters.eventName;
                  if (filters.startDate) params.startDate = filters.startDate;
                  if (filters.endDate) params.endDate = filters.endDate;
                  if (sort) params.sort = sort;
                  fetchSales(params);
                }}
              >
                Apply
              </button>

              {/* RESET BUTTON */}
              <button
                className="btn btn-outline"
                onClick={() => {
                  setFilters({
                    eventType: "",
                    eventName: "",
                    startDate: "",
                    endDate: "",
                  });
                  setSort("");
                  fetchSales();
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* SECOND CARD: OVERVIEW + TABLE */}
          <div
            className="bg-white rounded-xl shadow-sm border border-gray-200"
            style={{
              marginTop: "20px",
              padding: "24px",
              width: "100%",
            }}
          >
            {loading && <p>Loading…</p>}

            {!loading && error && (
              <div style={{ marginTop: "8px" }}>
                <pre style={{ color: "crimson", whiteSpace: "pre-wrap" }}>
                  {typeof error === "string"
                    ? error
                    : JSON.stringify(error, null, 2)}
                </pre>
              </div>
            )}

            {!loading && !error && (
              <>
                <div style={{ marginBottom: "12px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: 700 }}>
                    Overview
                  </h2>
                  <p style={{ marginTop: "4px", color: "#555" }}>
                    Total revenue across all events.
                  </p>
                </div>

                <div
                  style={{
                    marginBottom: "20px",
                    fontSize: "18px",
                    fontWeight: 700,
                  }}
                >
                  Total Revenue:{" "}
                  <span style={{ color: "var(--teal)" }}>
                    ${data.totalRevenue?.toFixed(2) || 0}
                  </span>
                </div>

                <hr style={{ margin: "16px 0" }} />

                <div style={{ marginTop: 12 }}>
                  {data.breakdown && data.breakdown.length ? (
                    <div className="overflow-x-auto">
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: "14px",
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              backgroundColor: "#f7f7fb",
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            <th
                              style={{
                                textAlign: "left",
                                padding: "10px",
                                fontWeight: 600,
                              }}
                            >
                              Type
                            </th>
                            <th
                              style={{
                                textAlign: "left",
                                padding: "10px",
                                fontWeight: 600,
                              }}
                            >
                              Title
                            </th>
                            <th
                              style={{
                                textAlign: "right",
                                padding: "10px",
                                fontWeight: 600,
                              }}
                            >
                              Attendees
                            </th>
                            {/* Only show Price column if there are non-bazaar events */}
                            {data.breakdown.some(
                              (b) => b.eventType !== "bazaar"
                            ) && (
                              <th
                                style={{
                                  textAlign: "right",
                                  padding: "10px",
                                  fontWeight: 600,
                                }}
                              >
                                Price
                              </th>
                            )}
                            <th
                              style={{
                                textAlign: "right",
                                padding: "10px",
                                fontWeight: 600,
                              }}
                            >
                              Revenue
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.breakdown.map((b) => (
                            <tr
                              key={b.id}
                              style={{
                                borderTop: "1px solid #eee",
                                backgroundColor: "white",
                              }}
                            >
                              <td style={{ padding: "10px" }}>
                                {b.eventType || "—"}
                              </td>
                              <td style={{ padding: "10px" }}>
                                {b.title || "—"}
                              </td>
                              <td
                                style={{ padding: "10px", textAlign: "right" }}
                              >
                                {b.attendees ?? 0}
                              </td>
                              {/* Only show Price cell if there are non-bazaar events */}
                              {data.breakdown.some(
                                (x) => x.eventType !== "bazaar"
                              ) && (
                                <td
                                  style={{
                                    padding: "10px",
                                    textAlign: "right",
                                  }}
                                >
                                  ${b.price?.toFixed(2) || 0}
                                </td>
                              )}
                              <td
                                style={{ padding: "10px", textAlign: "right" }}
                              >
                                ${b.revenue?.toFixed(2) || 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ color: "#666" }}>No sales data found yet.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
