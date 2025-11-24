// client/src/pages/MyApplicationsByStatus.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "../events.theme.css";
import {
  Menu,
  Search,
  User as UserIcon,
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
} from "lucide-react";
import VendorSidebar from "../components/VendorSidebar";

const API_ORIGIN = "http://localhost:3001";

export default function MyApplicationsByStatus() {
  const { status } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [bazaars, setBazaars] = useState([]);
  const [booths, setBooths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingPayment, setLoadingPayment] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // ================== Cancel Application ==================
  const handleCancel = async (appId, type) => {
    if (!window.confirm("Are you sure you want to cancel this application?"))
      return;

    try {
      const res = await fetch(
        `${API_ORIGIN}/api/${type}-applications/${appId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) throw new Error("Failed to cancel application");

      if (type === "bazaar") {
        setBazaars((prev) => prev.filter((app) => app._id !== appId));
      } else {
        setBooths((prev) => prev.filter((app) => app._id !== appId));
      }

      alert("Application canceled successfully!");
    } catch (err) {
      console.error(err);
      alert("Could not cancel application.");
    }
  };

  // ================== Price ==================
  const calculatePrice = (app, type) => {
    if (type === "bazaar") {
      const prices = {
        "Small (2x2)": 300,
        "Medium (3x3)": 600,
        "Large (4x4)": 1000,
        "Extra Large (5x5)": 1500,
      };
      return prices[app.boothSize] || 500;
    }
    if (type === "booth") {
      const prices = {
        "Main Gate": 500,
        "Food Court": 400,
        "Central Area": 350,
        "Side Wing": 250,
        default: 300,
      };
      return (prices[app.platformSlot] || 300) * (app.durationWeeks || 1);
    }
    return 0;
  };

  // ================== Status Colors ==================
  const getStatusColors = (status) => {
    switch (status) {
      case "accepted":
        return {
          bg: "bg-green-50",
          text: "text-green-800",
          border: "border-green-200",
        };
      case "rejected":
        return {
          bg: "bg-red-50",
          text: "text-red-800",
          border: "border-red-200",
        };
      case "pending":
        return {
          bg: "bg-yellow-50",
          text: "text-yellow-800",
          border: "border-yellow-200",
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-800",
          border: "border-gray-200",
        };
    }
  };

  // ================== Filter Applications ==================
  const filterApplications = (apps, type) => {
    return apps.filter((app) => {
      const searchLower = searchTerm.toLowerCase();
      if (type === "bazaar") {
        return (
          app.bazaar?.title?.toLowerCase().includes(searchLower) ||
          app.bazaar?.location?.toLowerCase().includes(searchLower) ||
          app.boothSize?.toLowerCase().includes(searchLower)
        );
      } else {
        return (
          app.vendorName?.toLowerCase().includes(searchLower) ||
          app.platformSlot?.toLowerCase().includes(searchLower)
        );
      }
    });
  };

  const filteredBazaars = filterApplications(bazaars, "bazaar");
  const filteredBooths = filterApplications(booths, "booth");

  // ================== Load User Email ==================
  useEffect(() => {
    try {
      const raw =
        localStorage.getItem("user") || localStorage.getItem("currentUser");
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.email) {
          setEmail(u.email);
        }
      }
    } catch {}
  }, []);

  // ================== Fetch Applications ==================
  useEffect(() => {
    const fetchApps = async () => {
      if (!email) return;
      setLoading(true);
      try {
        const res = await fetch(
          `${API_ORIGIN}/api/vendor/applications?email=${encodeURIComponent(
            email
          )}&status=${status}`
        );
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setBazaars(data.bazaars || []);
        setBooths(data.booths || []);
      } catch {
        setError("Could not load applications");
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [email, status]);

  // ================== PAYMENT ==================
  const handlePayment = (id, type) => {
    setLoadingPayment(id);
    navigate(`/payment?appId=${id}&type=${type}`);
  };

  // ================== Application Card Component ==================
  const ApplicationCard = ({ app, type }) => {
    const statusColors = getStatusColors(app.status);
    const price = calculatePrice(app, type);
    const isPaymentEligible =
      app.status === "accepted" &&
      !app.paid &&
      (!app.paymentDeadline || new Date() <= new Date(app.paymentDeadline));

    return (
      <div
        className={`bg-white rounded-2xl shadow-sm border ${statusColors.border} hover:shadow-md transition-all duration-300 overflow-hidden`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="font-bold text-xl text-gray-900 mb-2">
                {type === "bazaar"
                  ? app.bazaar?.title || "Bazaar Booth"
                  : app.vendorName || "Platform Booth"}
              </h3>

              {/* Details */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {type === "bazaar" ? (
                  <>
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="text-teal-600" />
                      <span>
                        {app.bazaar?.location || "Location not specified"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} className="text-teal-600" />
                      <span>Size: {app.boothSize}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="text-teal-600" />
                      <span>
                        {app.platformSlot || "Location not specified"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-teal-600" />
                      <span>
                        {app.durationWeeks} week
                        {app.durationWeeks > 1 ? "s" : ""}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div
              className={`px-4 py-2 rounded-full ${statusColors.bg} ${statusColors.text} border ${statusColors.border} font-semibold text-sm whitespace-nowrap`}
            >
              {app.status.toUpperCase()}
            </div>
          </div>

          {/* Payment Info */}
          {isPaymentEligible && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-blue-800 mb-2">
                <AlertCircle size={16} />
                <span className="font-semibold">Payment Required</span>
              </div>
              <p className="text-blue-700 text-sm">
                Complete your payment to secure this booth.
                {app.paymentDeadline &&
                  ` Deadline: ${new Date(
                    app.paymentDeadline
                  ).toLocaleDateString()}`}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            {isPaymentEligible ? (
              <>
                <button
                  onClick={() => handlePayment(app._id, type)}
                  disabled={loadingPayment === app._id}
                  className={`flex-1 py-3 px-6 rounded-xl font-semibold text-white text-sm shadow-md transition-all duration-200
                    bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
                    hover:shadow-lg transform hover:-translate-y-0.5
                    ${
                      loadingPayment === app._id
                        ? "opacity-60 cursor-not-allowed"
                        : ""
                    }`}
                >
                  {loadingPayment === app._id ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    `Pay ${price} EGP`
                  )}
                </button>
                <button
                  onClick={() => handleCancel(app._id, type)}
                  className="flex-1 py-3 px-6 rounded-xl font-semibold text-white text-sm shadow-md
                    bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 
                    hover:shadow-lg transition-all duration-200"
                >
                  Cancel
                </button>
              </>
            ) : app.paid ? (
              <div className="w-full py-3 px-6 bg-green-100 text-green-800 rounded-xl text-center font-semibold">
                ✅ Payment Completed
              </div>
            ) : (
              <button
                onClick={() => handleCancel(app._id, type)}
                className="flex-1 py-3 px-6 rounded-xl font-semibold text-white text-sm shadow-md
                  bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
                  hover:shadow-lg transition-all duration-200"
              >
                Cancel Application
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ===================================================================
  // =========================== RENDER ================================
  // ===================================================================
  return (
    <div
      className="events-theme"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      {/* === Shared Vendor Sidebar === */}
      <VendorSidebar
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        fetchBazaars={() => {}}
      />

      {/* === MAIN CONTENT === */}

      <main className="flex-1 ml-0 lg:ml-[260px] px-4 lg:px-8 pb-6 pt-0">
        {/* Sticky Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 -mx-4 lg:-mx-8 px-4 lg:px-8 py-4 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
              >
                <Menu size={24} className="text-gray-700" />
              </button>

              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search applications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center border border-teal-200">
              <UserIcon size={20} className="text-teal-700" />
            </div>
          </div>
        </header>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Applications - <span className="capitalize">{status}</span>
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your booth and bazaar applications in one place.
          </p>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            {
              status: "accepted",
              label: "Accepted",
              color: "bg-green-500 hover:bg-green-600",
            },
            {
              status: "pending",
              label: "Pending",
              color: "bg-yellow-500 hover:bg-yellow-600",
            },
            {
              status: "rejected",
              label: "Rejected",
              color: "bg-red-500 hover:bg-red-600",
            },
          ].map((tab) => (
            <Link
              key={tab.status}
              to={`/my-applications/${tab.status}`}
              className={`px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 whitespace-nowrap
                ${
                  status === tab.status
                    ? `${tab.color} shadow-lg`
                    : "bg-gray-400 hover:bg-gray-500"
                }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-8">
            <AlertCircle size={32} className="mx-auto text-red-500 mb-3" />
            <p className="text-red-800 font-semibold">{error}</p>
          </div>
        )}

        {/* Applications Content */}
        {!loading && !error && (
          <div className="space-y-8">
            {/* Bazaar Applications Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-teal-500 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Bazaar Applications
                </h2>
                <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {filteredBazaars.length}
                </span>
              </div>

              {filteredBazaars.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl p-8 text-center">
                  <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 text-lg">
                    {searchTerm
                      ? "No bazaar applications match your search."
                      : `No ${status} bazaar applications found.`}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredBazaars.map((app) => (
                    <ApplicationCard key={app._id} app={app} type="bazaar" />
                  ))}
                </div>
              )}
            </section>

            {/* Booth Applications Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-blue-500 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Booth Applications
                </h2>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {filteredBooths.length}
                </span>
              </div>

              {filteredBooths.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl p-8 text-center">
                  <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 text-lg">
                    {searchTerm
                      ? "No booth applications match your search."
                      : `No ${status} booth applications found.`}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredBooths.map((app) => (
                    <ApplicationCard key={app._id} app={app} type="booth" />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
