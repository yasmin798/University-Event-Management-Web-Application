// client/src/pages/AttendeesReport.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { reportAPI } from "../api/reportApi";
import "../events.theme.css";
import Sidebar from "../components/Sidebar";
import {
  Search,
  Filter,
  Calendar,
  Users,
  UserCheck,
  RefreshCw,
} from "lucide-react";

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

  // Auto-search when typing in the eventName field
  useEffect(() => {
    const delay = setTimeout(() => {
      // If the search box is empty → reset the table
      if (filters.eventName.trim() === "") {
        fetchReport(); // no params → get all events
        return;
      }

      // Otherwise fetch filtered results
      fetchReport({ eventName: filters.eventName });
    }, 400);

    return () => clearTimeout(delay);
  }, [filters.eventName]);

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      {/* SIDEBAR */}
      <Sidebar filter={filter} setFilter={setFilter} />

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-[260px] h-screen overflow-y-auto">
        {/* HEADER */}
        <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#2f4156]">
                Attendees Report
              </h1>
              <p className="text-gray-600 mt-1">
                Track event attendance and registration data
              </p>
            </div>
            <button
              onClick={fetchReport}
              className="flex items-center gap-2 px-4 py-2 bg-[#2f4156] text-white rounded-lg hover:bg-[#1f2d3d] transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <Filter size={20} className="text-[#2f4156]" />
            <h2 className="text-lg font-semibold text-[#2f4156]">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* SEARCH */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search events..."
                value={filters.eventName}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, eventName: e.target.value }))
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2f4156] focus:border-transparent"
              />
            </div>

            {/* EVENT TYPE */}
            <select
              value={filters.eventType}
              onChange={(e) =>
                setFilters((s) => ({ ...s, eventType: e.target.value }))
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2f4156] focus:border-transparent"
            >
              <option value="">All Event Types</option>
              <option value="workshop">Workshop</option>
              <option value="bazaar">Bazaar</option>
              <option value="trip">Trip</option>
              <option value="conference">Conference</option>
              <option value="gymsession">Gym Session</option>
            </select>

            {/* START DATE */}
            <div className="relative">
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, startDate: e.target.value }))
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2f4156] focus:border-transparent"
              />
            </div>

            {/* END DATE */}
            <div className="relative">
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((s) => ({ ...s, endDate: e.target.value }))
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2f4156] focus:border-transparent"
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-2 col-span-2">
              <button
                onClick={() => {
                  const params = {};
                  if (filters.eventType) params.eventType = filters.eventType;
                  if (filters.eventName) params.eventName = filters.eventName;
                  if (filters.startDate) params.startDate = filters.startDate;
                  if (filters.endDate) params.endDate = filters.endDate;
                  fetchReport(params);
                }}
                className="flex-1 bg-[#2f4156] text-white px-4 py-2 rounded-lg hover:bg-[#1f2d3d] transition-colors font-medium"
              >
                Apply Filters
              </button>
              <button
                onClick={() => {
                  setFilters({
                    eventType: "",
                    eventName: "",
                    startDate: "",
                    endDate: "",
                  });
                  fetchReport();
                }}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium border border-gray-300"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-8">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2f4156]"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* SUMMARY CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Users size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Attendees
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {data.totalAttendees || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <UserCheck size={24} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Events
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {data.breakdown?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <Users size={24} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Average Attendance
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {data.breakdown?.length
                          ? Math.round(
                              data.totalAttendees / data.breakdown.length
                            )
                          : 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ATTENDEES TABLE */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Attendance Breakdown
                  </h3>
                </div>

                {data.breakdown?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Event Type
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Attendees
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.breakdown.map((b, index) => (
                          <tr
                            key={b.id || index}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                {b.eventType || "—"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                              {b.title || "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              <span className="font-semibold text-blue-600">
                                {b.count ?? 0}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">
                      No attendance data found
                    </p>
                    <p className="text-gray-400 mt-2">
                      Try adjusting your filters
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
