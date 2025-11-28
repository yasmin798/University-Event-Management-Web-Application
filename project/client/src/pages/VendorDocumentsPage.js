// client/src/pages/VendorDocumentsPage.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Calendar,
  Store,
  FileText,
  Users,
  IdCardIcon,
} from "lucide-react";

const API_BASE = "http://localhost:3001";

const VendorDocumentsPage = () => {
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [taxCardFile, setTaxCardFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE}/api/vendors/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to load vendor profile");
        const data = await res.json();
        setVendor(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Error loading profile");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchVendor();
    } else {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!taxCardFile && !logoFile) {
      setError("Please select at least one file to upload.");
      return;
    }

    const formData = new FormData();
    if (taxCardFile) formData.append("taxCard", taxCardFile);
    if (logoFile) formData.append("logo", logoFile);

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/api/vendors/me/documents`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // don't set Content-Type manually when using FormData
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload documents");
      }

      setSuccessMsg("Documents uploaded successfully. Status set to pending.");
      setVendor((prev) =>
        prev
          ? {
              ...prev,
              taxCardUrl: data.taxCardUrl || prev.taxCardUrl,
              logoUrl: data.logoUrl || prev.logoUrl,
              vendorVerificationStatus: data.vendorVerificationStatus,
            }
          : prev
      );
      setTaxCardFile(null);
      setLogoFile(null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

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

      {/* ==================== SIDEBAR (same as VendorsPage) ==================== */}
      <aside
        className={`fixed left-0 top-0 h-screen w-[260px] bg-[#2f4156] text-white shadow-lg flex flex-col z-50
        transition-transform duration-300
        ${
          isMobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* LOGO */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-500" />
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

          {/* Current page: Company Documents */}
          <button
            onClick={() => navigate("/vendor-documents")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/20"
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
        {/* ---- Top Bar (aligned with VendorsPage style) ---- */}
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
            <h1 className="text-lg font-bold text-[#2f4156]">
              Company Documents
            </h1>
          </div>

          <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center">
            <UserIcon size={20} className="text-[#2f4156]" />
          </div>
        </header>

        {/* ---- Content ---- */}
        <div className="max-w-3xl w-full mx-auto">
          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : error ? (
            <p className="text-red-600 mb-4">{error}</p>
          ) : (
            <>
              {vendor && (
                <div className="mb-6 bg-white rounded-xl shadow p-4">
                  <h2 className="font-semibold text-[#2f4156] mb-2">
                    {vendor.companyName || "Your Company"}
                  </h2>
                  <p className="text-sm text-gray-600 mb-2">
                    {vendor.email}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Verification status:
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${statusColor(
                        vendor.vendorVerificationStatus
                      )}`}
                    >
                      {vendor.vendorVerificationStatus || "not_submitted"}
                    </span>
                  </div>
                </div>
              )}

              {successMsg && (
                <p className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                  {successMsg}
                </p>
              )}

              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-xl shadow p-4 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-[#2f4156] mb-1">
                    Tax Card (image or PDF)
                  </label>
                  {vendor?.taxCardUrl && (
                    <div className="mb-2">
                      <a
                        href={`${API_BASE}${vendor.taxCardUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 underline"
                      >
                        View current tax card
                      </a>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) =>
                      setTaxCardFile(e.target.files[0] || null)
                    }
                    className="block w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2f4156] mb-1">
                    Company Logo (image)
                  </label>
                  {vendor?.logoUrl && (
                    <div className="mb-2 flex items-center gap-3">
                      <img
                        src={`${API_BASE}${vendor.logoUrl}`}
                        alt="Current logo"
                        className="w-16 h-16 object-cover rounded-full border"
                      />
                      <span className="text-xs text-gray-600">
                        Current logo
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setLogoFile(e.target.files[0] || null)
                    }
                    className="block w-full text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#10b981] text-white rounded-lg text-sm hover:bg-[#0f916a] disabled:opacity-60"
                >
                  {saving ? "Uploading..." : "Save Documents"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default VendorDocumentsPage;
