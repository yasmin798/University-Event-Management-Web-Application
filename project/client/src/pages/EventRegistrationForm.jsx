import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./EventRegistrationForm.css";
import StudentSidebar from "../components/StudentSidebar";
import ProfessorSidebar from "../components/ProfessorSidebar";
import TaSidebar from "../components/TaSidebar";
import StaffSidebar from "../components/StaffSidebar";

import { Bell, User, Mic, MicOff } from "lucide-react"; // ⬅️ added Mic icons

const EventRegistrationForm = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    roleSpecificId: "",
    role: "student",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState("");

  const [formErrors, setFormErrors] = useState({});

  // 🔊 Voice state
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [lastTranscript, setLastTranscript] = useState("");
  const recognitionRef = useRef(null);

  // --------- BASIC USER DATA FROM TOKEN ----------
  useEffect(() => {
    const getUserRole = () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          return (payload.role || "student").toLowerCase();
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
      return "student";
    };
    setUserRole(getUserRole());
  }, []);

  // --------- AUTO-FILL FROM /api/users/me ----------
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get("/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const user = res.data;
        if (!user) return;

        setFormData((prev) => ({
          ...prev,
          firstName: user.firstName || prev.firstName,
          lastName: user.lastName || prev.lastName,
          email: user.email || prev.email,
          roleSpecificId:
            user.roleSpecificId || user.studentId || prev.roleSpecificId,
          role: (user.role || prev.role || "student").toLowerCase(),
        }));
      } catch (err) {
        console.error("Failed to load user profile", err);
      }
    };

    fetchProfile();
  }, []);

  // --------- UTILS ----------
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  // --------- SUBMIT LOGIC (shared by click + voice) ----------
  const submitRegistration = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem("token");
    const apiUrl = `/api/events/${eventId}/register`;

    console.log("📋 FORM SUBMISSION (voice or click):");
    console.log("  Event ID:", eventId);
    console.log("  Form Data:", {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      roleSpecificId: formData.roleSpecificId,
      role: formData.role,
    });
    console.log("  Auth Token:", token ? "Token found" : "No token found!");
    console.log("  API URL:", apiUrl);

    if (!token) {
      setError("You must be logged in to register.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        apiUrl,
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          roleSpecificId: formData.roleSpecificId,
          role: formData.role,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Registration successful! Redirecting...");
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Registraton failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, formData, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitRegistration();
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // --------- SPEAK HELPER ----------
  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);

  // --------- VOICE COMMAND LOGIC ----------
  const handleVoiceCommand = useCallback(
    (rawText) => {
      const cmd = rawText.toLowerCase().trim().replace(/[.!?]+$/g, "");

      // Cancel / go back
      if (
        cmd.includes("cancel") ||
        cmd === "back" ||
        cmd.includes("go back") ||
        cmd.includes("previous page")
      ) {
        navigate(-1);
        return "Cancelling registration and going back.";
      }

      // Submit registration
      if (
        cmd.includes("submit") ||
        cmd.includes("confirm") ||
        cmd.includes("complete registration") ||
        cmd.includes("register me") ||
        cmd.includes("submit registration")
      ) {
        submitRegistration(); // fire async, don't wait
        return "Submitting your registration.";
      }

      return "Sorry, I didn't understand. You can say submit registration or cancel.";
    },
    [navigate, submitRegistration]
  );

  // --------- SETUP SPEECH RECOGNITION ----------
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false; // one command at a time is enough here

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceStatus(
        "Listening... You can say: submit registration, confirm registration, or cancel."
      );
    };

    recognition.onend = () => {
      setIsListening(false);
      // don't auto-restart, user can press V or click mic again
    };

    recognition.onerror = (event) => {
      console.error("Voice error:", event.error);
      setIsListening(false);
      setVoiceStatus("Voice error. Try again.");
    };

    recognition.onresult = (event) => {
      const raw = event.results[0][0].transcript;
      const transcript = raw.toLowerCase().replace(/[.!?]+$/g, "").trim();
      console.log("Heard (registration):", transcript);
      setLastTranscript(transcript);

      const response = handleVoiceCommand(transcript);
      if (response) {
        speak(response);
        setVoiceStatus(response);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [handleVoiceCommand, speak]);

  // --------- KEYBOARD SHORTCUT: "V" TO TOGGLE MIC ----------
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === "v") {
        const recognition = recognitionRef.current;
        if (!recognition) return;

        if (isListening) {
          recognition.stop();
          setVoiceStatus("Stopped listening.");
        } else {
          try {
            recognition.start();
          } catch (err) {
            console.error("Recognition start error:", err);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isListening]);

  if (isLoading && !eventDetails)
    return <p style={{ textAlign: "center" }}>Loading event details...</p>;

  return (
    <div className="flex h-screen bg-[#f5efeb]">
      {/* Fixed Sidebar based on role */}
      {!userRole ? null : userRole === "professor" ? (
        <ProfessorSidebar />
      ) : userRole === "staff" ? (
        <StaffSidebar />
      ) : userRole === "ta" ? (
        <TaSidebar />
      ) : (
        <StudentSidebar />
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto ml-[260px]">
        {/* Header */}
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4 flex items-center justify-between">
          {/* Voice status (left or center) */}
          <div className="text-sm text-[#567c8d]">
            {voiceStatus || "Press V or click the mic to use voice commands."}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Mic button */}
            <button
              onClick={() => {
                const recognition = recognitionRef.current;
                if (!recognition) {
                  alert("Voice recognition is not supported in this browser.");
                  return;
                }

                if (isListening) {
                  recognition.stop();
                  setVoiceStatus("Stopped listening.");
                  return;
                }

                try {
                  recognition.start();
                } catch (e) {
                  console.error("Recognition start error:", e);
                }
              }}
              className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors"
              aria-label="Toggle voice assistant"
            >
              {isListening ? (
                <MicOff size={20} className="text-red-500" />
              ) : (
                <Mic size={20} className="text-[#567c8d]" />
              )}
            </button>

            <button className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors">
              <Bell size={20} className="text-[#567c8d]" />
            </button>
            <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center">
              <User size={20} className="text-[#2f4156]" />
            </div>
          </div>
        </header>

        {/* Last transcript strip */}
        {lastTranscript && (
          <div className="px-4 py-1 bg-[#e3f2fd] text-[#0d47a1] text-xs">
            👂 Last heard: "{lastTranscript}"
          </div>
        )}

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
                <p>
                  You can fill the form manually, or say “submit registration”
                  once everything is correct.
                </p>
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
                      <span className="error-text">
                        {formErrors.firstName}
                      </span>
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
                      <span className="error-text">
                        {formErrors.lastName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    className={`event-reg-input ${
                      formErrors.email ? "error" : ""
                    }`}
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <small className="input-hint">
                    Use your GUC email address
                  </small>
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
                    <span className="error-text">
                      {formErrors.roleSpecificId}
                    </span>
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
