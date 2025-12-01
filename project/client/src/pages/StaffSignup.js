// Updated StaffSignup.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function StaffSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    staffId: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [emailError, setEmailError] = useState("");

  // ✅ Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Email validation
    if (name === "email") {
      const regex = /^[a-zA-Z0-9._%+-]+@guc\.edu\.eg$/;
      if (!regex.test(value)) {
        setEmailError("❌ Wrong email format, should be @guc.edu.eg");
      } else {
        setEmailError("");
      }
    }
  };

  // ✅ Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.staffId ||
      !formData.email ||
      !formData.password
    ) {
      setMessage("⚠️ Please fill in all fields.");
      setIsError(true);
      return;
    }

    if (emailError) {
      setMessage("⚠️ Please fix your email format first.");
      setIsError(true);
      return;
    }

    try {
      // ✅ Send data to backend (runs on port 3000)
      const response = await fetch("http://localhost:3000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          roleSpecificId: formData.staffId,
          email: formData.email,
          password: formData.password,
          role: "staff",
        }),
      });

      const data = await response.json();

      // Handle failed signup
      if (!response.ok) {
        if (data.error === "Email already registered") {
          setMessage(
            <>
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
            </>
          );
          setIsError(true);
        } else {
          setMessage(`❌ ${data.error || "Signup failed"}`);
          setIsError(true);
        }
        return;
      }

      // ✅ Success: show custom staff message
      if (data.user && data.user.role === "unassigned") {
        setMessage("✅ Registration complete, awaiting admin verification!");
      } else {
        setMessage(data.message || "✅ Signup successful!");
      }

      setIsError(false);

      // Clear form
      setFormData({
        firstName: "",
        lastName: "",
        staffId: "",
        email: "",
        password: "",
      });
      setEmailError("");
      setTimeout(() => {
  navigate("/login");
}, 2000);
    } catch (error) {
      console.error("❌ Fetch error:", error);
      setMessage(`❌ Error: ${error.message}`);
      setIsError(true);
    }
  };

  return (
    <div style={formContainerStyle}>
      <h1 style={titleStyle}>Staff Signup</h1>

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
          name="staffId"
          placeholder="Staff ID"
          value={formData.staffId}
          onChange={handleChange}
          style={inputStyle}
        />
        <input
          type="email"
          name="email"
          placeholder="Email (e.g. staff@guc.edu.eg)"
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

/* ---------- Styles ---------- */
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