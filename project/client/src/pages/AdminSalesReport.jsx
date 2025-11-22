// client/src/pages/AdminSalesReport.jsx
import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import FixedSidebarAdmin from "../components/FixedSidebarAdmin";
import "../events.theme.css";
import { Menu } from "lucide-react";

const API_ORIGIN =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:3001";

export default function AdminSalesReport() {
  const [data, setData] = useState({ totalRevenue: 0, breakdown: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // filters & sort (same design as SalesReport)
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

      // Read body as text then attempt JSON parse (so we can inspect server error payload)
      const txt = await res.text().catch(() => null);
      let body = null;
      try {
        body = txt ? JSON.parse(txt) : null;
      } catch (err) {
        body = null;
      }

      if (!res.ok) {
        // If server indicates forbidden/unauthorized with role info, handle gracefully
        if (res.status === 401 || res.status === 403) {
          const detected = body?.detectedRole || null;
          if (detected) {
            // Clear stored token to avoid repeated 403s and show a helpful message
            localStorage.removeItem("token");
            setError(
              `Access denied: your account role is '${detected}'. Please log in as admin or staff to view this page.`
            );
            setLoading(false);
            return;
          }
        }

        throw new Error(`${res.status} ${txt || res.statusText}`);
      }

      const reportData = body || (await res.json());
      setData(reportData);
      setError(null);
    } catch (err) {
      console.error("Sales report error", err);
      setError(err?.message || "Failed to load sales report.");
    } finally {
      setLoading(false);
    }
  };

  // INITIAL LOAD
  useEffect(() => {
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AUTO SEARCH (eventName only)
  useEffect(() => {
    const delay = setTimeout(() => {
      if (filters.eventName.trim() === "") {
        fetchSales();
        return;
      }
      fetchSales({ eventName: filters.eventName });
    }, 400);

    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.eventName]);

  return (
    <div className="flex h-screen bg-[#f5efeb]">
      {/* Fixed admin sidebar (same layout as events office sidebar) */}
      <FixedSidebarAdmin />

      {/* MAIN CONTENT */}
      <main
        style={{
          flex: 1,
          padding: "0px", // full width like AttendeesReport & SalesReport
          marginLeft: "260px", // width of the fixed sidebar
        }}
      >
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors">
                <Menu size={24} className="text-[#2f4156]" />
              </button>

              <h1 className="text-xl font-bold text-[#2f4156]">Sales Report</h1>
            </div>
          </div>
        </header>

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

        {/* SECOND CARD — OVERVIEW + TABLE */}
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-200"
          style={{
            marginTop: "8px", // match SalesReport & AttendeesReport spacing
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
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Overview</h2>
              <p style={{ marginTop: 4, color: "#555" }}>
                Total revenue across selected events.
              </p>

              <div
                style={{
                  marginTop: 12,
                  marginBottom: 20,
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                Total Revenue:{" "}
                <span style={{ color: "var(--teal)" }}>
                  ${data.totalRevenue?.toFixed(2) || 0}
                </span>
              </div>

              <hr style={{ margin: "16px 0" }} />

              {data.breakdown && data.breakdown.length > 0 ? (
                <div className="overflow-x-auto">
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 14,
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          backgroundColor: "#f7f7fb",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        <th style={{ padding: 10, textAlign: "left" }}>Type</th>
                        <th style={{ padding: 10, textAlign: "left" }}>
                          Title
                        </th>
                        <th style={{ padding: 10, textAlign: "right" }}>
                          Attendees
                        </th>
                        {/* Only show Price column if there are non-bazaar events */}
                        {data.breakdown.some(
                          (b) => b.eventType !== "bazaar"
                        ) && (
                          <th style={{ padding: 10, textAlign: "right" }}>
                            Price
                          </th>
                        )}
                        <th style={{ padding: 10, textAlign: "right" }}>
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
                          <td style={{ padding: 10 }}>{b.eventType || "—"}</td>
                          <td style={{ padding: 10 }}>{b.title || "—"}</td>
                          <td style={{ padding: 10, textAlign: "right" }}>
                            {b.attendees ?? 0}
                          </td>
                          {/* Only show Price cell if there are non-bazaar events */}
                          {data.breakdown.some(
                            (x) => x.eventType !== "bazaar"
                          ) && (
                            <td style={{ padding: 10, textAlign: "right" }}>
                              ${b.price?.toFixed(2) || 0}
                            </td>
                          )}
                          <td style={{ padding: 10, textAlign: "right" }}>
                            ${b.revenue?.toFixed(2) || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: "#666" }}>
                  No sales data found for selected filters.
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
