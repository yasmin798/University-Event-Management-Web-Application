import React, { useEffect, useState } from "react";
import /* useNavigate */ "react-router-dom";
import { Menu, Search } from "lucide-react";
import FixedSidebarAdmin from "../components/FixedSidebarAdmin";
import "../events.theme.css";

const API_ORIGIN =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:3001";

export default function AdminAttendeesReport() {
  const [data, setData] = useState({ totalAttendees: 0, breakdown: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // fixed sidebar used (shared admin sidebar component)
  const [filters, setFilters] = useState({
    eventType: "",
    eventName: "",
    startDate: "",
    endDate: "",
  });

  const fetchReport = async (params = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams(params).toString();
      const url = `${API_ORIGIN}/api/reports/attendees${
        query ? `?${query}` : ""
      }`;
      const token = localStorage.getItem("token");
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const txt = await res.text().catch(() => null);
      let body = null;
      try {
        body = txt ? JSON.parse(txt) : null;
      } catch (err) {
        body = null;
      }

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          const detected = body?.detectedRole || null;
          if (detected) {
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
      console.error("Failed to fetch attendees report", err);
      setError(err?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (filters.eventName.trim() === "") {
        fetchReport();
        return;
      }
      fetchReport({ eventName: filters.eventName });
    }, 400);

    return () => clearTimeout(delay);
  }, [filters.eventName]);

  // logout handled by FixedSidebarAdmin

  return (
    <div className="flex h-screen bg-[#f5efeb]">
      {/* Fixed admin sidebar (shared component) */}
      <FixedSidebarAdmin />

      {/* Main Section */}
      <div className="flex-1 overflow-auto" style={{ marginLeft: "260px" }}>
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors">
                <Menu size={24} className="text-[#2f4156]" />
              </button>
              <h1 className="text-xl font-bold text-[#2f4156]">
                Attendees Report
              </h1>
            </div>
          </div>
        </header>

        <main
          style={{
            flex: 1,
            padding: "0px",
          }}
        >
          {/* TOP CARD: SEARCH + FILTERS (touching top) */}
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
                              <td style={{ padding: "10px" }}>
                                {b.title || "—"}
                              </td>
                              <td
                                style={{ padding: "10px", textAlign: "right" }}
                              >
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
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
