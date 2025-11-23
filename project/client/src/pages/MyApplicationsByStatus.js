// client/src/pages/MyApplicationsByStatus.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "../events.theme.css";
import { CheckCircle, Menu, X, Search, LogOut, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_ORIGIN = "http://localhost:3001";

export default function MyApplicationsByStatus() {
  const { status } = useParams(); // 'pending' or 'rejected'
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [bazaars, setBazaars] = useState([]);
  const [booths, setBooths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingPayment, setLoadingPayment] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const calculatePrice = (app, type) => {
    if (type === "bazaar") {
      const size = app.boothSize || "";
      const prices = {
        "Small (2x2)": 300,
        "Medium (3x3)": 600,
        "Large (4x4)": 1000,
        "Extra Large (5x5)": 1500,
      };
      return prices[size] || 500;
    } else if (type === "booth") {
      const location = app.platformSlot || app.location || "default";
      const weeks = app.durationWeeks || 1;
      const prices = {
        "Main Gate": 500,
        "Food Court": 400,
        "Central Area": 350,
        "Side Wing": 250,
        "default": 300
      };
      return (prices[location] || 300) * weeks;
    }
    return 0;
  };

  // Detect logged-in user or use manual input
  useEffect(() => {
    try {
      const raw =
        localStorage.getItem("user") || localStorage.getItem("currentUser");
      if (raw) {
        const u = JSON.parse(raw);
        if (u && u.email) {
          setEmail(u.email);
          return;
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    const fetchApps = async () => {
      if (!email) return;
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${API_ORIGIN}/api/vendor/applications?email=${encodeURIComponent(
            email
          )}&status=${status}`
        );
        if (!res.ok) throw new Error("Failed to fetch applications");
        const data = await res.json();
        setBazaars(data.bazaars || []);
        setBooths(data.booths || []);
      } catch (err) {
        console.error(err);
        setError("Could not load your applications");
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [email, status]);

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const handlePayment = (applicationId, type) => {
    setLoadingPayment(applicationId);
    navigate(`/payment?appId=${applicationId}&type=${type}`);
  };

  return (
    <div className="events-theme" style={{ display: "flex", minHeight: "100vh" }}>
      {/* ==================== MOBILE SIDEBAR OVERLAY ==================== */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ==================== SIDEBAR (Permanent on desktop, toggle on mobile) ==================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#2f4156] text-white flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo / Title */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#567c8d] rounded-full" />
            <span className="text-xl font-bold">Vendor Hub</span>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-2 hover:bg-[#567c8d] rounded-lg md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links (Vendor Options) */}
        <nav className="flex-1 px-4">
          <ul className="space-y-2">
            <li>
              <Link
                to="/vendors"
                className="block py-2 px-4 hover:bg-[#567c8d] rounded transition-colors"
              >
                Upcoming Bazaars
              </Link>
            </li>
            <li>
              <Link
                to="/apply-booth"
                className="block py-2 px-4 hover:bg-[#567c8d] rounded transition-colors"
              >
                Apply for Booth in Platform
              </Link>
            </li>
            <li>
              <Link
                to="/my-applications/accepted"
                className="block py-2 px-4 hover:bg-[#567c8d] rounded transition-colors"
              >
                View Applications
              </Link>
            </li>
            <li>
              <Link
                to="/guc-loyalty-apply"
                className="block py-2 px-4 hover:bg-[#567c8d] rounded transition-colors"
              >
                Apply for GUC Loyalty Program
              </Link>
            </li>
          </ul>
        </nav>

        {/* Logout */}
        <div className="px-4 pb-4">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-2 bg-[#c88585] hover:bg-[#b87575] text-white py-3 px-4 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ==================== MAIN AREA ==================== */}
      <main style={{ flex: 1, marginLeft: "260px", padding: "0 24px 24px" }}>
        {/* ---- Top Search & Info Bar (Mobile menu button) ---- */}
        <header
          style={{
            marginLeft: "-24px",
            marginRight: "-24px",
            width: "calc(100% + 48px)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--card)",
            borderRadius: "0 0 16px 16px",
            boxShadow: "var(--shadow)",
            padding: "10px 20px",
            marginBottom: "20px",
            position: "sticky",
            top: 0,
            zIndex: 5,
          }}
        >
          {/* LEFT: Mobile menu + search */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
              flex: 1,
            }}
          >
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors md:hidden"
            >
              <Menu size={24} className="text-[#2f4156]" />
            </button>
            <div style={{ position: "relative", width: "260px", flex: 1, maxWidth: "100%" }}>
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
                placeholder="Search applications..."
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 34px",
                  borderRadius: "10px",
                  border: "1px solid rgba(47,65,86,0.2)",
                  fontSize: "13px",
                }}
              />
            </div>
          </div>
          {/* RIGHT: user icon */}
          <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center">
            <UserIcon size={20} className="text-[#2f4156]" />
          </div>
        </header>

        {/* ---- Welcome ---- */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            width: "100%",
          }}
        >
          <div>
            <h1
              style={{
                color: "var(--navy)",
                fontWeight: 800,
                marginBottom: "4px",
              }}
            >
              Welcome back, Vendor
            </h1>
            <p
              className="eo-sub"
              style={{
                marginTop: 0,
                marginBottom: 0,
              }}
            >
              Manage your booth and bazaar applications.
            </p>
          </div>
        </div>

        {/* Status tabs */}
        <div className="mb-4 flex gap-3">
          <Link
            to="/my-applications/accepted"
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Accepted
          </Link>
          <Link
            to="/my-applications/pending"
            className="bg-yellow-500 text-white px-4 py-2 rounded"
          >
            Pending
          </Link>
          <Link
            to="/my-applications/rejected"
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Rejected
          </Link>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <>
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">
                Bazaar Applications
              </h2>
              {bazaars.length === 0 ? (
                <p>No {status} bazaar applications found.</p>
              ) : (
                <ul className="space-y-3">
                  {/* Bazaar Applications */}
                  {bazaars.map((app) => (
                    <li key={app._id} className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                      <h3 className="font-bold text-lg text-gray-800">{app.bazaar?.title || "Bazaar Booth"}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {app.bazaar?.location} • Size: {app.boothSize}
                      </p>

                      <div className="mt-4 flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          app.status === "accepted" ? "bg-green-100 text-green-800" :
                          app.status === "rejected" ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                          {app.status.toUpperCase()}
                        </span>
                      </div>

                      {/* PAYMENT BUTTON LOGIC */}
                      <div className="mt-5">
                        {app.paid ? (
                          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-5 py-3 rounded-lg font-semibold">
                            <CheckCircle size={22} />
                            Already Paid
                          </div>
                        ) : app.paymentDeadline && new Date() > new Date(app.paymentDeadline) ? (
                          <div className="flex items-center gap-2 text-red-700 bg-red-50 px-5 py-3 rounded-lg font-semibold">
                            Payment Expired
                          </div>
                        ) : app.status === "accepted" ? (
                          <button
                            onClick={() => handlePayment(app._id, "bazaar")}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transform transition hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={loadingPayment === app._id}
                          >
                            <p className="text-lg font-bold text-emerald-600 mt-3">
                              Amount Due: {calculatePrice(app, "bazaar")} EGP
                            </p>
                            {loadingPayment === app._id ? "Processing..." : "Pay Now"}
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Booth Applications</h2>
              {booths.length === 0 ? (
                <p>No {status} booth applications found.</p>
              ) : (
                <ul className="space-y-3">
                  {/* Booth Applications */}
                  {booths.map((b) => (
                    <li key={b._id} className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                      <h3 className="font-bold text-lg text-gray-800">{b.vendorName || "Platform Booth"}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Location: {b.platformSlot || "—"} • Duration: {b.durationWeeks} weeks
                      </p>

                      <div className="mt-4 flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          b.status === "accepted" ? "bg-green-100 text-green-800" :
                          b.status === "rejected" ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                          {b.status.toUpperCase()}
                        </span>
                      </div>

                      {/* PAYMENT BUTTON – SAME LOGIC */}
                      <div className="mt-5">
                        {b.paid ? (
                          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-5 py-3 rounded-lg font-semibold">
                            <CheckCircle size={22} />
                            Already Paid
                          </div>
                        ) : b.paymentDeadline && new Date() > new Date(b.paymentDeadline) ? (
                          <div className="flex items-center gap-2 text-red-700 bg-red-50 px-5 py-3 rounded-lg font-semibold">
                            Payment Expired
                          </div>
                        ) : b.status === "accepted" ? (
                          <button
                            onClick={() => handlePayment(b._id, "booth")}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transform transition hover:scale-105 disabled:opacity-60"
                            disabled={loadingPayment === b._id}
                          >
                            <p className="text-lg font-bold text-emerald-600 mt-3">
                              Amount Due: {calculatePrice(b, "booth")} EGP
                            </p>
                            {loadingPayment === b._id ? "Processing..." : "Pay Now"}
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}