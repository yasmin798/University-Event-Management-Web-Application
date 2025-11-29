// client/src/pages/VendorsPage.js
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, LogOut, User as UserIcon, Menu, X, IdCard, IdCardIcon } from "lucide-react";
import bazaarImg from "../images/Arabbazaarisolatedonwhitebackground_FreeVector.jpeg"; // Reuse from EventsHome imports
import { Calendar, Store, FileText, Users } from "lucide-react";
import EventityLogo from "../components/EventityLogo";

const VendorsPage = () => {
  const navigate = useNavigate();

  // ------- state -------
  const [bazaars, setBazaars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // ------- fetch bazaars -------
  const fetchBazaars = useCallback(async () => {
    setLoading(true);
    setError("");
    setCurrentPage(1); // Reset pagination on refresh
    try {
      const res = await fetch("http://localhost:3001/api/bazaars");
      if (!res.ok) throw new Error("Failed to fetch bazaars");

      const data = await res.json();
      const list = data.items || data || [];

      // Filter out past bazaars
      const now = new Date();
      const upcoming = list.filter((b) => new Date(b.endDateTime) >= now);

      setBazaars(upcoming);

      if (upcoming.length === 0) setError("No upcoming bazaars found.");
    } catch (err) {
      console.error(err);
      setError("Error fetching bazaars. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBazaars();
  }, [fetchBazaars]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const filteredBazaars = bazaars.filter((bazaar) => {
    const term = debouncedSearch.toLowerCase();
    return (
      !term ||
      bazaar.title?.toLowerCase().includes(term) ||
      bazaar.location?.toLowerCase().includes(term) ||
      bazaar.shortDescription?.toLowerCase().includes(term)
    );
  });

  // Pagination
  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.ceil(filteredBazaars.length / ITEMS_PER_PAGE);
  const indexOfLast = currentPage * ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - ITEMS_PER_PAGE;
  const currentBazaars = filteredBazaars.slice(indexOfFirst, indexOfLast);

  return (
    <div
      className="events-theme"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      {/* ==================== MOBILE SIDEBAR OVERLAY ==================== */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-[260px] bg-[#2f4156] text-white shadow-lg flex flex-col z-50
    transition-transform duration-300
    ${
      isMobileSidebarOpen
        ? "translate-x-0"
        : "-translate-x-full md:translate-x-0"
    }
  `}
      >
        {/* LOGO */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div style={{ marginTop: "8px" }}>
              <EventityLogo size={35} showText={false} />
            </div>
            <h2 className="text-[22px] font-extrabold">Vendor Hub</h2>
          </div>

          {/* Close button only on mobile */}
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <button
            onClick={() => navigate("/vendors")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-white/5"
          >
            <Calendar size={18} />
            <span>Upcoming Bazaars</span>
          </button>

          <button
            onClick={() => navigate("/apply-booth")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-white/5"
          >
            <Store size={18} />
            <span>Apply for Booth in Platform</span>
          </button>

          <button
            onClick={() => navigate("/my-applications/accepted")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-white/5"
          >
            <FileText size={18} />
            <span>View Applications</span>
          </button>

          <button
            onClick={() => navigate("/guc-loyalty-apply")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-white/5"
          >
            <Users size={20} />
            <span>Apply for GUC Loyalty Program</span>
          </button>
          <button
            onClick={() => navigate("/vendor-documents")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-white/5"
          >
            <IdCardIcon size={18} />
            <span>Company Documents</span>
          </button>
        </nav>

        {/* LOGOUT */}
        <div className="px-3 pb-8 pt-4 border-t border-white/10 mt-auto">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/20"
          >
            <LogOut size={30} />
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
            <div
              style={{
                position: "relative",
                width: "260px",
                flex: 1,
                maxWidth: "100%",
              }}
            >
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
                placeholder="Search bazaars by title, location, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "60%",
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

        {/* ---- Welcome + Pagination Row ---- */}
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
              Browse upcoming bazaars and manage your applications.
            </p>
          </div>
          {/* Pagination */}
          {filteredBazaars.length > ITEMS_PER_PAGE && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="pg-btn arrow"
              >
                ‹
              </button>
              <div className="pg-btn current">{currentPage}</div>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="pg-btn arrow"
              >
                ›
              </button>
            </div>
          )}
        </div>

        {/* ---- Main Bazaars Grid ---- */}
        {loading ? (
          <p style={{ color: "var(--text-muted)", marginTop: "40px" }}>
            Loading bazaars...
          </p>
        ) : error ? (
          <p style={{ color: "var(--text-muted)", marginTop: "40px" }}>
            {error}
          </p>
        ) : filteredBazaars.length === 0 ? (
          <p style={{ color: "var(--text-muted)", marginTop: "40px" }}>
            No bazaars match your search.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "24px",
              alignItems: "stretch",
            }}
          >
            {currentBazaars.map((bazaar) => (
              <article
                key={bazaar._id}
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  height: "430px", // Consistent height like EventsHome
                }}
              >
                {/* TOP CONTENT */}
                <div style={{ flexGrow: 1 }}>
                  <img
                    src={bazaarImg}
                    alt={bazaar.title}
                    style={{
                      width: "100%",
                      height: "150px",
                      objectFit: "cover",
                      borderRadius: "12px",
                      marginBottom: "12px",
                    }}
                  />
                  <div className="chip">BAZAAR</div>
                  <div className="kv">
                    <span className="k">Title:</span>
                    <span className="v">{bazaar.title}</span>
                  </div>
                  <div className="kv">
                    <span className="k">Location:</span>
                    <span className="v">{bazaar.location || "—"}</span>
                  </div>
                  <div className="kv">
                    <span className="k">Start:</span>
                    <span className="v">
                      {new Date(bazaar.startDateTime).toLocaleString()}
                    </span>
                  </div>
                  <div className="kv">
                    <span className="k">End:</span>
                    <span className="v">
                      {new Date(bazaar.endDateTime).toLocaleString()}
                    </span>
                  </div>
                  {bazaar.shortDescription && (
                    <div className="kv">
                      <span className="k">Description:</span>
                      <span className="v">{bazaar.shortDescription}</span>
                    </div>
                  )}
                </div>
                {/* ACTIONS */}
                <div
                  className="actions"
                  style={{
                    marginTop: "12px",
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <Link
                    to={`/apply/${bazaar._id}`}
                    className="btn"
                    style={{ background: "#10b981", color: "white" }} // Green for apply
                  >
                    Apply Now
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default VendorsPage;
