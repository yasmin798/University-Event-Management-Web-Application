import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Menu, X, Search, LogOut, User as UserIcon } from "lucide-react";
import "./EventRegistrationForm.css"; // reuse same styles

const GUCLoyaltyForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: "",
    discountRate: "",
    promoCode: "",
    termsAndConditions: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) setFormErrors({ ...formErrors, [name]: "" });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.companyName.trim()) errors.companyName = "Company Name is required";
    if (!formData.discountRate) errors.discountRate = "Discount Rate is required";
    if (!formData.promoCode.trim()) errors.promoCode = "Promo Code is required";
    if (!formData.termsAndConditions.trim()) errors.termsAndConditions = "Terms & Conditions required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:3001/api/loyalty/apply",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess("Application submitted successfully!");
      setTimeout(() => navigate("/vendors"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Submission failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => navigate("/vendors");

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
                placeholder="Search..."
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

        <div className="event-reg-page">
          <div className="event-reg-container">
            <div className="event-reg-card">
              <div className="event-reg-form-header">
                <h2>GUC Loyalty Program Application</h2>
                <p>Fill in your company details and submit your application</p>
              </div>

              <form className="event-reg-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input
                    className={`event-reg-input ${formErrors.companyName ? "error" : ""}`}
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Enter your company name"
                  />
                  {formErrors.companyName && <span className="error-text">{formErrors.companyName}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Discount Rate (%) *</label>
                  <input
                    className={`event-reg-input ${formErrors.discountRate ? "error" : ""}`}
                    name="discountRate"
                    type="number"
                    value={formData.discountRate}
                    onChange={handleChange}
                    placeholder="Enter discount rate"
                  />
                  {formErrors.discountRate && <span className="error-text">{formErrors.discountRate}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Promo Code *</label>
                  <input
                    className={`event-reg-input ${formErrors.promoCode ? "error" : ""}`}
                    name="promoCode"
                    value={formData.promoCode}
                    onChange={handleChange}
                    placeholder="Enter promo code"
                  />
                  {formErrors.promoCode && <span className="error-text">{formErrors.promoCode}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Terms & Conditions *</label>
                  <textarea
                    className={`event-reg-input ${formErrors.termsAndConditions ? "error" : ""}`}
                    name="termsAndConditions"
                    value={formData.termsAndConditions}
                    onChange={handleChange}
                    placeholder="Enter terms and conditions"
                  />
                  {formErrors.termsAndConditions && <span className="error-text">{formErrors.termsAndConditions}</span>}
                </div>

                <div className="form-actions">
                  <button type="button" className="event-reg-button secondary" onClick={handleCancel}>Cancel</button>
                  <button type="submit" className="event-reg-button primary" disabled={isLoading}>
                    {isLoading ? "Submitting..." : "Submit Application"}
                  </button>
                </div>

                {success && <div className="event-reg-message">{success}</div>}
                {error && <div className="event-reg-error">{error}</div>}
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GUCLoyaltyForm;