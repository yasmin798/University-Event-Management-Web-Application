// client/src/pages/AdminSalesReport.jsx
import React, { useEffect, useState } from "react";
import {
  Search,
  Filter,
  Calendar,
  DollarSign,
  Users,
  RefreshCw,
} from "lucide-react";
import FixedSidebarAdmin from "../components/FixedSidebarAdmin";
import "../events.theme.css";

const API_ORIGIN =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:3001";

export default function AdminSalesReport() {
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
      const query = new URLSearchParams(params).toString();
      const url = `${API_ORIGIN}/api/reports/sales${query ? `?${query}` : ""}`;
      const token = localStorage.getItem("token");

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const txt = await res.text().catch(() => null);
      let body = null;
      try {
        body = txt ? JSON.parse(txt) : null;
      } catch {}

      if (!res.ok) throw new Error(body?.error || txt || "Failed");

      const reportData = body || (await res.json());
      setData(reportData);
      setError(null);
    } catch (err) {
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
      if (filters.eventName.trim() === "") fetchSales();
      else fetchSales({ eventName: filters.eventName });
    }, 400);

    return () => clearTimeout(delay);
  }, [filters.eventName]);

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      <FixedSidebarAdmin />

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-[260px] h-screen overflow-y-auto">
        {/* HEADER */}
        <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#2f4156]">
                Sales Report
              </h1>
              <p className="text-gray-600 mt-1">
                Track revenue and sales performance
              </p>
            </div>
            <button
              onClick={fetchSales}
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
              <option value="bazaar">Bazaar (Booths)</option>
              <option value="booth">Platform Booths</option>
              <option value="trip">Trips</option>
              <option value="workshop">Workshops</option>
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

            {/* SORT */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2f4156] focus:border-transparent"
            >
              <option value="">Sort By</option>
              <option value="revenue_asc">Revenue: Low to High</option>
              <option value="revenue_desc">Revenue: High to Low</option>
            </select>

            {/* ACTION BUTTONS */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const params = {};
                  if (filters.eventType) params.eventType = filters.eventType;
                  if (filters.eventName) params.eventName = filters.eventName;
                  if (filters.startDate) params.startDate = filters.startDate;
                  if (filters.endDate) params.endDate = filters.endDate;
                  if (sort) params.sort = sort;
                  fetchSales(params);
                }}
                className="flex-1 bg-[#2f4156] text-white px-4 py-2 rounded-lg hover:bg-[#1f2d3d] transition-colors font-medium"
              >
                Apply
              </button>
              <button
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
              <p className="text-red-700">
                {typeof error === 'string' ? error : error?.message || 'An error occurred'}
              </p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* SUMMARY CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <DollarSign size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Revenue
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {data.totalRevenue?.toFixed(2) || "0.00"} EGP
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <Users size={24} className="text-green-600" />
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
              </div>

              {/* SALES TABLE */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Sales Breakdown
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
                            Revenue
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
                                {b.eventType}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                              {b.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 text-right">
                              {b.revenue?.toFixed(2) || "0.00"} EGP
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <DollarSign
                      size={48}
                      className="mx-auto text-gray-400 mb-4"
                    />
                    <p className="text-gray-500 text-lg">No sales data found</p>
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
