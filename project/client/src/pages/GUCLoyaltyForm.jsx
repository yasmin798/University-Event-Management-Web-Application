import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Menu,
  Search,
  User as UserIcon,
  Percent,
  Building,
  Tag,
  FileText,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import "./EventRegistrationForm.css";
import VendorSidebar from "../components/VendorSidebar";

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
const [existingParticipation, setExistingParticipation] = useState(null);
const [loadingParticipation, setLoadingParticipation] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) setFormErrors({ ...formErrors, [name]: "" });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.companyName.trim())
      errors.companyName = "Company Name is required";
    if (!formData.discountRate)
      errors.discountRate = "Discount Rate is required";
    else if (formData.discountRate < 1 || formData.discountRate > 100)
      errors.discountRate = "Discount rate must be between 1% and 100%";
    if (!formData.promoCode.trim()) errors.promoCode = "Promo Code is required";
    else if (!/^[A-Z0-9_-]+$/.test(formData.promoCode))
      errors.promoCode =
        "Promo code can only contain uppercase letters, numbers, hyphens, and underscores";
    if (!formData.termsAndConditions.trim())
      errors.termsAndConditions = "Terms & Conditions are required";

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
        "/api/loyalty/apply",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess("Application submitted successfully!");
      setTimeout(() => navigate("/vendors"), 2000);
    } catch (err) {
      setError(
        err.response?.data?.error || "Submission failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };
useEffect(() => {
  const loadParticipation = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/loyalty/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExistingParticipation(res.data[0] || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingParticipation(false);
    }
  };

  loadParticipation();
}, []);


const handleCancelParticipation = async () => {
  try {
    const token = localStorage.getItem("token");
    await axios.delete("/api/loyalty/cancel", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setExistingParticipation(null); // reset to show the form again
  } catch (err) {
    setError("Could not cancel participation.");
  }
};


  const handleCancel = () => navigate("/vendors");

  return (
    <div
      className="events-theme"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      {/* --- Shared Vendor Sidebar --- */}
      <VendorSidebar
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        fetchBazaars={() => {}}
      />

      {/* ==================== MAIN AREA ==================== */}
      <main className="flex-1 ml-0 lg:ml-[260px] px-4 lg:px-8 py-6">
        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              GUC Loyalty Program
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join our exclusive loyalty program and offer special discounts to
              GUC community members. Increase your visibility and build lasting
              relationships with our students and staff.
            </p>
          </div>

          {/* Benefits Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Building size={24} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Brand Exposure
              </h3>
              <p className="text-blue-700 text-sm">
                Reach thousands of GUC members
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Percent size={24} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-green-900 mb-1">
                Customer Loyalty
              </h3>
              <p className="text-green-700 text-sm">
                Build long-term customer relationships
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Tag size={24} className="text-purple-600" />
              </div>
              <h3 className="font-semibold text-purple-900 mb-1">
                Exclusive Promotions
              </h3>
              <p className="text-purple-700 text-sm">
                Feature your special offers
              </p>
            </div>
          </div>
{loadingParticipation ? (
  <p>Loading...</p>
) : existingParticipation ? (
  // ===== SHOW PARTICIPATION DETAILS =====
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
    <h2 className="text-2xl font-bold mb-4">Your Loyalty Program Participation</h2>

    <p><strong>Company:</strong> {existingParticipation.companyName}</p>
    <p><strong>Discount:</strong> {existingParticipation.discountRate}%</p>
    <p><strong>Promo Code:</strong> {existingParticipation.promoCode}</p>
    <p><strong>Terms:</strong></p>
    <pre className="bg-gray-100 p-3 rounded">{existingParticipation.termsAndConditions}</pre>

    <button
      onClick={handleCancelParticipation}
      className="mt-6 py-3 px-6 bg-red-500 text-white rounded-xl"
    >
      Cancel Participation
    </button>
  </div>
) : (
  // ===== SHOW THE ORIGINAL FORM =====
  <form className="p-6 lg:p-8" onSubmit={handleSubmit}>
          {/* Application Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Application Form</h2>
              <p className="text-teal-100 text-sm">
                Fill in your company details below
              </p>
            </div>

            
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Company Name */}
                <div className="lg:col-span-2">
                  <label className="form-label flex items-center gap-2 mb-3">
                    <Building size={18} className="text-teal-600" />
                    Company Name *
                  </label>
                  <input
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-teal-200 ${
                      formErrors.companyName
                        ? "border-red-300 bg-red-50 focus:border-red-500"
                        : "border-gray-300 focus:border-teal-500"
                    }`}
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Enter your company name"
                  />
                  {formErrors.companyName && (
                    <span className="text-red-600 text-sm font-medium mt-2 flex items-center gap-1">
                      {formErrors.companyName}
                    </span>
                  )}
                </div>

                {/* Discount Rate */}
                <div>
                  <label className="form-label flex items-center gap-2 mb-3">
                    <Percent size={18} className="text-teal-600" />
                    Discount Rate (%) *
                  </label>
                  <div className="relative">
                    <input
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-teal-200 ${
                        formErrors.discountRate
                          ? "border-red-300 bg-red-50 focus:border-red-500"
                          : "border-gray-300 focus:border-teal-500"
                      }`}
                      name="discountRate"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.discountRate}
                      onChange={handleChange}
                      placeholder="e.g., 15"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                      %
                    </div>
                  </div>
                  {formErrors.discountRate && (
                    <span className="text-red-600 text-sm font-medium mt-2 flex items-center gap-1">
                      {formErrors.discountRate}
                    </span>
                  )}
                </div>

                {/* Promo Code */}
                <div>
                  <label className="form-label flex items-center gap-2 mb-3">
                    <Tag size={18} className="text-teal-600" />
                    Promo Code *
                  </label>
                  <input
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-teal-200 uppercase ${
                      formErrors.promoCode
                        ? "border-red-300 bg-red-50 focus:border-red-500"
                        : "border-gray-300 focus:border-teal-500"
                    }`}
                    name="promoCode"
                    value={formData.promoCode}
                    onChange={handleChange}
                    placeholder="e.g., GUC15OFF"
                    style={{ textTransform: "uppercase" }}
                  />
                  {formErrors.promoCode && (
                    <span className="text-red-600 text-sm font-medium mt-2 flex items-center gap-1">
                      {formErrors.promoCode}
                    </span>
                  )}
                  <p className="text-gray-500 text-xs mt-2">
                    Use uppercase letters, numbers, hyphens, and underscores
                    only
                  </p>
                </div>

                {/* Terms & Conditions */}
                <div className="lg:col-span-2">
                  <label className="form-label flex items-center gap-2 mb-3">
                    <FileText size={18} className="text-teal-600" />
                    Terms & Conditions *
                  </label>
                  <textarea
                    rows="4"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-teal-200 resize-none ${
                      formErrors.termsAndConditions
                        ? "border-red-300 bg-red-50 focus:border-red-500"
                        : "border-gray-300 focus:border-teal-500"
                    }`}
                    name="termsAndConditions"
                    value={formData.termsAndConditions}
                    onChange={handleChange}
                    placeholder="Describe the terms and conditions for using this discount..."
                  />
                  {formErrors.termsAndConditions && (
                    <span className="text-red-600 text-sm font-medium mt-2 flex items-center gap-1">
                      {formErrors.termsAndConditions}
                    </span>
                  )}
                </div>
              </div>

              {/* Success/Error Messages */}
              {success && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle2 size={20} />
                    <span className="font-semibold">{success}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2 text-red-800">
                    <span className="font-semibold">{error}</span>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-4 px-6 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200 border border-gray-300"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </div>
                  ) : (
                    "Submit Application"
                  )}
                </button>
              </div>
            
          </div>
   </form>
               )}
          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Application review typically takes 2-3 business days. You will be
              notified via email once approved.
            </p>
            
          </div>

        </div>
        
      </main>
    </div>
  );
};

export default GUCLoyaltyForm;
