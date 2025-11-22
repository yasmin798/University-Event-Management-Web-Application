// client/src/pages/SalesReport.js
import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { salesAPI } from "../api/reportApi";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

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

  // INITIAL LOAD
  useEffect(() => {
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AUTO SEARCH (eventName only)
  useEffect(() => {
    const delay = setTimeout(() => {
      // if search box is empty → reset
      if (filters.eventName.trim() === "") {
        fetchSales();
        return;
      }
      // otherwise apply search
      fetchSales({ eventName: filters.eventName });
    }, 400);

    return () => clearTimeout(delay);
  }, [filters.eventName]);

  return (
    <div
      className="events-theme"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      <Sidebar />

      {/* MAIN CONTENT */}
      <main
        style={{
          flex: 1,
          padding: "0px", // matches AttendeesReport full width
          marginLeft: "260px",
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

            {/* FILTER BUTTON */}
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

        {/* SECOND CARD — OVERVIEW */}
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-200"
          style={{
            marginTop: "8px", // smaller gap to match AttendeesReport
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
                  {data.totalRevenue}
                </span>
              </div>

              <hr style={{ margin: "16px 0" }} />

              {data.breakdown.length > 0 ? (
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
                        <th style={{ padding: 10, textAlign: "right" }}>
                          Price
                        </th>
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
            </>
          )}
        </div>
      </main>
    </div>
  );
}
