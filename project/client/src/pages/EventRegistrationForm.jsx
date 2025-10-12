import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
//import axios from 'axios'; // uncomment after testing ui
import { registerForEvent } from "../testData/mockAPI"; // remove after ui testing
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
  const [currentStep, setCurrentStep] = useState(1);
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

  /* const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`http://localhost:3000/api/events/${eventId}/register`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(res.data.message);
      setError('');
    } catch (err) {
      setError(err.response?.data.error || 'Registration failed');
      setMessage('');
    }
  }; */ // uncomment after testing ui
  const handleSubmit = async (e) => {
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
  }; // remove after testing ui
  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };
  useEffect(() => {
    // Simulate fetching event details
    const mockEventData = {
      _id: eventId || "1",
      name: "Workshop A",
      startDate: "2025-11-01",
      capacity: 50,
      location: "Room 101",
      type: "workshop",
    };
    setEventDetails(mockEventData);
  }, [eventId]);
  return (
    <div className="event-reg-page">
      {eventDetails && (
        <div className="event-reg-header">
          <h1>Register for {eventDetails.name}</h1>
          <p>
            {formatDate(eventDetails.startDate)} • {eventDetails.location} •
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
