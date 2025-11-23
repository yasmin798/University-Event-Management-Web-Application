import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
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

  const handleCancel = () => navigate(-1);

  return (
    <div className="event-reg-page">
      <div className="flex items-center gap-2 mb-4 p-4">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-[#2f4156] hover:text-[#45687a] font-medium"
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>

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
  );
};

export default GUCLoyaltyForm;
