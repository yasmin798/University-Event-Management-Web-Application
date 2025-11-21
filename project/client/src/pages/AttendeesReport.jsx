// client/src/pages/AttendeesReport.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { reportAPI } from "../api/reportApi";
import "../events.theme.css";
import Sidebar from "../components/Sidebar";
import { Search } from "lucide-react";

export default function AttendeesReport() {
  const navigate = useNavigate();
  const [data, setData] = useState({ totalAttendees: 0, breakdown: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    eventType: "",
    eventName: "",
    startDate: "",
    endDate: "",
  });
  const [filter, setFilter] = useState("All");

  // fetch function that uses current filters
  const fetchReport = async (params = {}) => {
    setLoading(true);
    try {
      const res = await reportAPI.getAttendeesReport(params);
      setData(res);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch attendees report", err);
      const status = err?.response?.status;
      const body = err?.response?.data || err.message || "Error";

      if (status === 401) {
        try {
          const msg = (err.response.data && err.response.data.error) || "";
          if (
            msg.toLowerCase().includes("token expired") ||
            msg.toLowerCase().includes("invalid token") ||
            msg.toLowerCase().includes("not authorized")
          ) {
            localStorage.removeItem("token");
            setError("Session expired. Redirecting to login...");
            setTimeout(() => navigate("/login"), 800);
            return;
          }
        } catch (e) {}
      }

      setError(body);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="events-theme"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      {/* SIDEBAR */}
      <Sidebar filter={filter} setFilter={setFilter} />

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: "20px", marginLeft: "260px" }}>
        <h1>Attendees Report</h1>

        {/* FILTER BAR */}
        <div
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
          style={{ marginTop: "20px", marginBottom: "20px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            {/* SEARCH BAR (MATCHES EVENTS HOME EXACTLY) */}
            <div style={{ position: "relative", width: "350px" }}>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="#5a7184"
                viewBox="0 0 24 24"
              >
                <path d="M7 11h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" />
                <path
                  d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.66 0-3 1.34-3 3v12c0 1.66 1.34 3 3 
                  3h14c1.66 0 3-1.34 3-3V7c0-1.66-1.34-3-3-3zm1 15c0 .55-.45 1-1 
                  1H5c-.55 0-1-.45-1-1V10h16v9z"
                />
              </svg>

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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="#5a7184"
                viewBox="0 0 24 24"
              >
                <path d="M7 11h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" />
                <path
                  d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.66 0-3 1.34-3 
                  3v12c0 1.66 1.34 3 3 3h14c1.66 0 3-1.34 3-3V7c0-1.66-1.34-3-3-3zm1 
                  15c0 .55-.45 1-1 1H5c-.55 0-1-.45-1-1V10h16v9z"
                />
              </svg>

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

            {/* FILTER BUTTON */}
            <button
              className="btn"
              onClick={() => {
                const params = {};
                if (filters.eventType) params.eventType = filters.eventType;
                if (filters.eventName) params.eventName = filters.eventName;
                if (filters.startDate) params.startDate = filters.startDate;
                if (filters.endDate) params.endDate = filters.endDate;
                fetchReport(params);
              }}
            >
              Filter
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
                fetchReport();
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {loading && <p>Loading…</p>}

        {!loading && error && (
          <div
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
            style={{ marginTop: "16px" }}
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
            style={{ marginTop: "16px" }}
          >
            <div style={{ marginBottom: "12px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Overview</h2>
              <p style={{ marginTop: "4px", color: "#555" }}>
                Total registered attendees across all events.
              </p>
            </div>

            <div
              style={{
                marginBottom: "20px",
                fontSize: "18px",
                fontWeight: 700,
              }}
            >
              Total Attendees:{" "}
              <span style={{ color: "var(--teal)" }}>
                {data.totalAttendees}
              </span>
            </div>

            <hr style={{ margin: "16px 0" }} />

            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: 8 }}>
              Breakdown by Event
            </h3>

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
                          <td style={{ padding: "10px" }}>{b.title || "—"}</td>
                          <td style={{ padding: "10px", textAlign: "right" }}>
                            {b.count ?? 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: "#666" }}>No registrations found yet.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
