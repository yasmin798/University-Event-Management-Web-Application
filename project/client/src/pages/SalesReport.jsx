import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { salesAPI } from "../api/reportApi";
import { useNavigate } from "react-router-dom";

export default function SalesReport() {
  const navigate = useNavigate();
  const [data, setData] = useState({ totalRevenue: 0, breakdown: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      const res = await salesAPI.getSalesReport(params);
      setData(res);
      setError(null);
    } catch (err) {
      console.error("Sales report error", err);
      const status = err?.response?.status;
      const body = err?.response?.data || err.message || "Error";
      if (status === 401) {
        localStorage.removeItem("token");
        setError("Session expired. Redirecting to login...");
        setTimeout(() => navigate("/login"), 800);
        return;
      }
      setError(body);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="events-theme"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      <Sidebar />
      <main style={{ flex: 1, padding: "20px", marginLeft: "260px" }}>
        <h1>Sales Report</h1>

        {/* Filters */}
        <div
          style={{
            marginTop: 12,
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <select
            value={filters.eventType}
            onChange={(e) =>
              setFilters((s) => ({ ...s, eventType: e.target.value }))
            }
            style={{ padding: 8 }}
          >
            <option value="">All types</option>
            <option value="workshop">Workshop</option>
            <option value="bazaar">Bazaar</option>
            <option value="trip">Trip</option>
            <option value="conference">Conference</option>
            <option value="gymsession">Gym Session</option>
          </select>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            From{" "}
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((s) => ({ ...s, startDate: e.target.value }))
              }
            />
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            To{" "}
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((s) => ({ ...s, endDate: e.target.value }))
              }
            />
          </label>

          <button
            className="btn-primary"
            onClick={() => {
              const params = {};
              if (filters.eventType) params.eventType = filters.eventType;
              if (filters.eventName) params.eventName = filters.eventName;
              if (filters.startDate) params.startDate = filters.startDate;
              if (filters.endDate) params.endDate = filters.endDate;
              if (sort) params.sort = sort;
              fetchSales(params);
            }}
            style={{ padding: "8px 12px" }}
          >
            Filter
          </button>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ padding: 8 }}
          >
            <option value="">Sort: none</option>
            <option value="revenue_asc">Revenue: Low → High</option>
            <option value="revenue_desc">Revenue: High → Low</option>
          </select>
          <button
            className="btn-outline"
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
            style={{ padding: "8px 12px" }}
          >
            Reset
          </button>
        </div>

        {loading && <p>Loading…</p>}
        {!loading && error && (
          <div
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
            style={{ marginTop: 16 }}
          >
            <pre style={{ color: "crimson", whiteSpace: "pre-wrap" }}>
              {typeof error === "string"
                ? error
                : JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}

        {!loading && !error && (
          <div
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
            style={{ marginTop: 16 }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Overview</h2>
            <p style={{ marginTop: 4, color: "#555" }}>
              Total revenue across selected events.
            </p>
            <div style={{ marginTop: 12, fontSize: 18, fontWeight: 700 }}>
              Total Revenue:{" "}
              <span style={{ color: "var(--teal)" }}>{data.totalRevenue}</span>
            </div>

            <hr style={{ margin: "16px 0" }} />

            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Breakdown by Event
            </h3>
            <div style={{ marginTop: 12 }}>
              {data.breakdown && data.breakdown.length ? (
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
                        <th
                          style={{
                            textAlign: "left",
                            padding: 10,
                            fontWeight: 600,
                          }}
                        >
                          Type
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: 10,
                            fontWeight: 600,
                          }}
                        >
                          Title
                        </th>
                        <th
                          style={{
                            textAlign: "right",
                            padding: 10,
                            fontWeight: 600,
                          }}
                        >
                          Attendees
                        </th>
                        <th
                          style={{
                            textAlign: "right",
                            padding: 10,
                            fontWeight: 600,
                          }}
                        >
                          Price
                        </th>
                        <th
                          style={{
                            textAlign: "right",
                            padding: 10,
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
                          <td style={{ padding: 10 }}>{b.eventType}</td>
                          <td style={{ padding: 10 }}>{b.title}</td>
                          <td style={{ padding: 10, textAlign: "right" }}>
                            {b.attendees ?? 0}
                          </td>
                          <td style={{ padding: 10, textAlign: "right" }}>
                            {b.price ?? 0}
                          </td>
                          <td style={{ padding: 10, textAlign: "right" }}>
                            {b.revenue ?? 0}
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
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
