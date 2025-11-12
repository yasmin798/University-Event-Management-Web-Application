// Updated StudentSignup.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function StudentSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    studentId: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [emailError, setEmailError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "email") {
      validateEmail(value);
    }
  };

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@student\.guc\.edu\.eg$/;
    if (!regex.test(email)) {
      setEmailError(" Wrong email format, should be @student.guc.edu.eg.");
    } else {
      setEmailError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.studentId ||
      !formData.email ||
      !formData.password
    ) {
      setMessage("Please fill in all fields correctly.");
      setIsError(true);
      return;
    }

    if (emailError) {
      setMessage("Please fix your email format before submitting.");
      setIsError(true);
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          roleSpecificId: formData.studentId,
          email: formData.email,
          password: formData.password,
          role: "student",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "Email already registered") {
          setMessage(
            <span>
              Email already registered.{" "}
              <a
                href="/login"
                style={{
                  color: "#10B981",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/login");
                }}
              >
                Go to Login page
              </a>
            </span>
          );
          setIsError(true);
        } else {
          throw new Error(data.error || "Signup failed");
        }
        return;
      }

      setMessage("✅ Registration complete, awaiting admin approval!");
      setIsError(false);
      // Clear form
      setFormData({
        firstName: "",
        lastName: "",
        studentId: "",
        email: "",
        password: "",
      });
      setEmailError("");
      // Redirect to Login after success
      setTimeout(() => {
        navigate("/login");
      }, 2500); // 2.5 second delay to show success message
    } catch (error) {
      setMessage(`⚠️ Error: ${error.message}`);
      setIsError(true);
    }
  };

  return (
    <div style={formContainerStyle}>
      <h1 style={titleStyle}>Student Signup</h1>

      <form onSubmit={handleSubmit} style={formStyle}>
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={formData.firstName}
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          type="text"
          name="studentId"
          placeholder="Student ID"
          value={formData.studentId}
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          type="email"
          name="email"
          placeholder="Email (e.g. malak@student.guc.edu.eg)"
          value={formData.email}
          onChange={handleChange}
          style={{
            ...inputStyle,
            borderColor: emailError ? "red" : "#D1D5DB",
          }}
        />
        {emailError && (
          <p style={{ color: "red", fontSize: "0.9rem", textAlign: "left" }}>
            {emailError}
          </p>
        )}

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          style={inputStyle}
        />

        <button type="submit" style={buttonStyle}>
          Sign Up
        </button>
      </form>

      {message && (
        <p
          style={{
            marginTop: "20px",
            textAlign: "center",
            color: isError ? "red" : "green",
            fontWeight: "500",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

// Styles - Adjusted for card integration
const formContainerStyle = {
  width: "100%",
  maxWidth: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};

const titleStyle = {
  textAlign: "center",
  fontSize: "2.2rem", // Slightly bigger
  color: "#111827",
  marginBottom: "30px",
  fontWeight: "700",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "20px", // More gap for better spacing
  width: "100%",
};

const inputStyle = {
  padding: "15px 20px", // Bigger padding
  borderRadius: "12px", // Rounder
  border: "2px solid #D1D5DB", // Thicker border
  fontSize: "1.1rem", // Larger text
  outline: "none",
  transition: "border-color 0.3s ease",
};

const buttonStyle = {
  backgroundColor: "#567c8d",
  color: "white",
  padding: "15px", // Bigger
  border: "none",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "1.1rem", // Larger
  transition: "all 0.3s ease",
};