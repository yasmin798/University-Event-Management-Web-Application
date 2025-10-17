import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios"; // uncomment after testing ui
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
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // newly added
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

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
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Retrieve the token from localStorage (or wherever you store it)
    const token = localStorage.getItem("token");
    const apiUrl = `/api/events/${eventId}/register`;
    // --- Start of Debugging Logs ---
    console.log("Attempting registration...");
    console.log("Event ID:", eventId);
    console.log("Auth Token:", token ? "Token found" : "No token found!");
    console.log("API URL:", apiUrl);
    // --- End of Debugging Logs ---
    if (!token) {
      setError("You must be logged in to register.");
      setIsLoading(false);
      return;
    }

    try {
      // The backend expects a POST request to this specific endpoint
      const response = await axios.post(
        apiUrl,
        {}, // No body is needed, user info comes from the token
        {
          headers: {
            // The 'protect' middleware requires this header format
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Registration successful! Redirecting...");
      setTimeout(() => {
        navigate(-1); // Redirect to registered events page
      }, 2000);
    } catch (err) {
      // Display the specific error message from the backend
      const errorMessage =
        err.response?.data?.error || "Registraton failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };
  // Fetch real event details
  /*  useEffect(() => {
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
  }, [eventId]); */
  const getRoleLabel = () => {
    switch (formData.role) {
      case "student":
        return "Student ID";
      case "staff":
        return "Staff ID";
      case "ta":
        return "TA ID";
      case "professor":
        return "Professor ID";
      default:
        return "ID";
    }
  };

  if (isLoading && !eventDetails)
    return <p style={{ textAlign: "center" }}>Loading event details...</p>;

  return (
    <div className="event-reg-page">
      <div className="event-reg-header">
        <h1>Event Registration</h1>
        <p>Complete your registration details below</p>
      </div>

      <div className="event-reg-container">
        <div className="event-reg-card">
          <div className="event-reg-form-header">
            <h2>Registration Form</h2>
            <p>Please complete your information to secure your spot</p>
          </div>

          <form className="event-reg-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">
                  First Name *
                </label>
                <input
                  id="firstName"
                  className={`event-reg-input ${
                    formErrors.firstName ? "error" : ""
                  }`}
                  name="firstName"
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
                {formErrors.firstName && (
                  <span className="error-text">{formErrors.firstName}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="lastName" className="form-label">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  className={`event-reg-input ${
                    formErrors.lastName ? "error" : ""
                  }`}
                  name="lastName"
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
                {formErrors.lastName && (
                  <span className="error-text">{formErrors.lastName}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address *
              </label>
              <input
                id="email"
                className={`event-reg-input ${formErrors.email ? "error" : ""}`}
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <small className="input-hint">Use your GUC email address</small>
              {formErrors.email && (
                <span className="error-text">{formErrors.email}</span>
              )}
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
                {getRoleLabel()} *
              </label>
              <input
                id="roleSpecificId"
                className={`event-reg-input ${
                  formErrors.roleSpecificId ? "error" : ""
                }`}
                name="roleSpecificId"
                placeholder={`Enter your ${getRoleLabel().toLowerCase()}`}
                value={formData.roleSpecificId}
                onChange={handleChange}
                required
              />
              {formErrors.roleSpecificId && (
                <span className="error-text">{formErrors.roleSpecificId}</span>
              )}
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
                disabled={isLoading}
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

          {success && (
            <div className="event-reg-message">
              <div className="message-icon">✓</div>
              <div>
                <p style={{ fontWeight: "600", margin: "0 0 4px 0" }}>
                  {success}
                </p>
                <p className="redirect-notice">
                  You will be redirected shortly...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="event-reg-error">
              <div className="message-icon">!</div>
              <div>
                <p style={{ fontWeight: "600", margin: 0 }}>{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventRegistrationForm;
