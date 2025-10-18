import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios"; // uncomment after testing ui
//import { registerForEvent } from "../testData/mockAPI"; // remove after ui testing
import "./EventRegistrationForm.css";
import { ArrowLeft } from "lucide-react";

import { Menu, Bell, User, LogOut, Home, Calendar } from "lucide-react";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState("");
  React.useEffect(() => {
    const getUserRole = () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.role || "student";
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
      return "student";
    };
    setUserRole(getUserRole());
  }, []);
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
        navigate(-1); // Redirect to previous page
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
  // Sidebar functions
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleDashboard = () => {
    switch (userRole.toLowerCase()) {
      case "staff":
        navigate("/staff/dashboard");
        break;
      case "ta":
        navigate("/ta/dashboard");
        break;
      case "professor":
        navigate("/professor/dashboard");
        break;
      default:
        navigate("/student/dashboard");
        break;
    }
    closeSidebar();
  };
  const handleRegisteredEvents = () => {
    navigate("/events/registered");
    closeSidebar();
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      navigate("/");
    }
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
    <div className="flex h-screen bg-[#f5efeb]">
      {/* Sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        ></div>
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#2f4156] text-white flex flex-col transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#567c8d] rounded-full"></div>
            <span className="text-xl font-bold">EventHub</span>
          </div>
          <button
            onClick={closeSidebar}
            className="p-2 hover:bg-[#567c8d] rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
        
        {/* Navigation Links */}
        <div className="flex-1 px-4 mt-4 space-y-2">
          {/* Dashboard Button */}
          <button
            onClick={handleDashboard}
            className="w-full flex items-center gap-3 bg-[#567c8d] hover:bg-[#45687a] text-white py-3 px-4 rounded-lg transition-colors text-left"
          >
            <Home size={18} />
            {userRole ? `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard` : 'Dashboard'}
          </button>

          {/* Registered Events Button */}
          <button
            onClick={handleRegisteredEvents}
            className="w-full flex items-center gap-3 bg-[#567c8d] hover:bg-[#45687a] text-white py-3 px-4 rounded-lg transition-colors text-left"
          >
            <Calendar size={18} />
            Registered Events
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-[#c88585] hover:bg-[#b87575] text-white py-3 px-4 rounded-lg transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Header with sidebar toggle */}
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors"
          >
            <Menu size={24} className="text-[#2f4156]" />
          </button>

          <div className="flex items-center gap-2 md:gap-4 ml-4">
            <button className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors">
              <Bell size={20} className="text-[#567c8d]" />
            </button>
            <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center">
              <User size={20} className="text-[#2f4156]" />
            </div>
          </div>
        </header>
<div className="flex items-center gap-2 mb-4">
  <button
    onClick={() => navigate(-1)}
    className="flex items-center gap-2 text-[#2f4156] hover:text-[#45687a] font-medium"
  >
    <ArrowLeft size={18} />
    Back
  </button>
</div>

        {/* Registration Form Content */}
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
      </div>
    </div>
  );
};

export default EventRegistrationForm;
