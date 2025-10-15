import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from 'axios'; // uncomment after testing ui
//import { registerForEvent } from "../testData/mockAPI"; // remove after ui testing
import "./EventRegistrationForm.css";

const EventRegistrationForm = () => {
  const { eventId } = useParams();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    roleSpecificId: "",
    role: "student",
  });
  const navigate = useNavigate(); // newly added
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [eventDetails, setEventDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // newly added
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  //const [currentStep, setCurrentStep] = useState(1);
  const [formErrors, setFormErrors] = useState({});
  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.email.trim() || !formData.email.includes("@"))
      errors.email = "Valid email is required";
    if (!formData.roleSpecificId.trim())
      errors.roleSpecificId = "ID is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found. Please log in.");

      const res = await axios.post(
        `http://localhost:3000/api/events/${eventId}/register`,
        { ...formData, type: eventDetails?.type || "workshop" }, // Include event type
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      setError("");
      setTimeout(() => navigate("/registered-events"), 2000); // Redirect after 2s
    } catch (err) {
      setError(err.response?.data.error || "Registration failed. Please try again.");
      setMessage("");
    } finally {
      setIsLoading(false);
    }
  }; // uncomment after testing ui
  /* const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await registerForEvent(); // Mock registration
      setMessage(res.message);
      setError("");
      // Optionally clear form: setFormData({ name: '', email: '', roleSpecificId: '' });
    } catch (err) {
      setError("Registration failed. Using mock data.");
      setMessage("");
    }
  }; */ // remove after testing ui
  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };
  // Fetch real event details
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        let endpoint = "";
        // Determine endpoint based on event type (assumes type is in URL or defaults to workshop)
        if (eventId) {
          // Try workshop first, then trip if fails (basic type detection)
          try {
            const workshopRes = await axios.get(`http://localhost:3000/api/workshops/${eventId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setEventDetails(workshopRes.data);
          } catch (workshopErr) {
            const tripRes = await axios.get(`http://localhost:3000/api/trips/${eventId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setEventDetails(tripRes.data);
          }
        }
      } catch (err) {
        setError("Failed to load event details.");
        setEventDetails({ _id: eventId, name: "Unknown Event", type: "workshop" }); // Fallback
      } finally {
        setIsLoading(false);
      }
    };
    fetchEventDetails();
  }, [eventId]);

  if (isLoading && !eventDetails) return <p style={{ textAlign: "center" }}>Loading event details...</p>;

  return (
    <div className="event-reg-page">
      {eventDetails && (
        <div className="event-reg-header">
          <h1>Register for {eventDetails.name}</h1>
          <p>
            {formatDate(eventDetails.startDateTime)} • {eventDetails.location} •
            Capacity: {eventDetails.capacity}
          </p>
        </div>
      )}

      <div className="event-reg-container">
        <div className="event-reg-card">
          <div className="event-reg-form-header">
            <h2>Registration Form</h2>
            <p>Please complete your information below</p>
          </div>

          <form className="event-reg-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">
                  First Name
                </label>
                <input
                  id="firstName"
                  className="event-reg-input"
                  name="firstName"
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
                {formErrors.firstName && <span className="error-text">{formErrors.firstName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="lastName" className="form-label">
                  Last Name
                </label>
                <input
                  id="lastName"
                  className="event-reg-input"
                  name="lastName"
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
                {formErrors.lastName && <span className="error-text">{formErrors.lastName}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                className="event-reg-input"
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <small className="input-hint">Use your GUC email address</small>
              {formErrors.email && <span className="error-text">{formErrors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="role" className="form-label">
                Your Role
              </label>
              <select
                id="role"
                className="event-reg-select"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="ta">Teaching Assistant</option>
                <option value="professor">Professor</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="roleSpecificId" className="form-label">
                {formData.role === "student"
                  ? "Student ID"
                  : formData.role === "staff"
                  ? "Staff ID"
                  : formData.role === "ta"
                  ? "TA ID"
                  : "Professor ID"}
              </label>
              <input
                id="roleSpecificId"
                className="event-reg-input"
                name="roleSpecificId"
                placeholder={`Enter your ${formData.role} ID`}
                value={formData.roleSpecificId}
                onChange={handleChange}
                required
              />
              {formErrors.roleSpecificId && <span className="error-text">{formErrors.roleSpecificId}</span>}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="event-reg-button secondary"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className="event-reg-button primary"
                type="submit"
                disabled={isLoading || Object.keys(formErrors).length > 0}
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Processing...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </button>
            </div>
          </form>

          {message && (
            <div className="event-reg-message">
              <div className="message-icon success">✓</div>
              <div>
                <p>{message}</p>
                <p className="redirect-notice">
                  You will be redirected shortly...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="event-reg-error">
              <div className="message-icon error">!</div>
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventRegistrationForm;
