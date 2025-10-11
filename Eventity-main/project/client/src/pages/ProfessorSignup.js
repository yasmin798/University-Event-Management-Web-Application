import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ProfessorSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    professorId: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "email") {
      validateEmail(value);
    }
  };

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@guc\.edu\.eg$/;
    if (!regex.test(email)) {
      setEmailError(" Wrong email format, should be @guc.edu.eg.");
    } else {
      setEmailError("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.professorId ||
      !formData.email ||
      !formData.password
    ) {
      setMessage("Please fill in all fields correctly.");
      return;
    }

    if (emailError) {
      setMessage("Please fix your email format before submitting.");
      return;
    }

    console.log("Professor Signup Data:", formData);
    setMessage("Signup successful!");
  };

  return (
    <div style={containerStyle}>
      <div style={formBoxStyle}>
        <h1 style={titleStyle}>Professor Signup</h1>

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
            name="professorId"
            placeholder="Professor ID"
            value={formData.professorId}
            onChange={handleChange}
            style={inputStyle}
          />
          <input
            type="email"
            name="email"
            placeholder="Email (e.g. malak@guc.edu.eg)"
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
              marginTop: "15px",
              textAlign: "center",
              color: message.includes("⚠️") ? "red" : "green",
              fontWeight: "500",
            }}
          >
            {message}
          </p>
        )}

        <button onClick={() => navigate("/signup")} style={backButtonStyle}>
          ← Back to Role Selection
        </button>
      </div>
    </div>
  );
}

// Styles (same for all)
const containerStyle = {
  minHeight: "100vh",
  backgroundColor: "#F3F4F6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "Poppins, Arial, sans-serif",
  padding: "20px",
};

const formBoxStyle = {
  background: "white",
  borderRadius: "16px",
  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
  padding: "40px",
  width: "100%",
  maxWidth: "400px",
};

const titleStyle = {
  textAlign: "center",
  fontSize: "2rem",
  color: "#111827",
  marginBottom: "30px",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "15px",
};

const inputStyle = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #D1D5DB",
  fontSize: "1rem",
  outline: "none",
};

const buttonStyle = {
  backgroundColor: "#F59E0B",
  color: "white",
  padding: "12px",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600",
};

const backButtonStyle = {
  marginTop: "25px",
  backgroundColor: "#E5E7EB",
  color: "#111827",
  border: "none",
  borderRadius: "10px",
  padding: "10px 20px",
  fontSize: "0.95rem",
  fontWeight: "500",
  cursor: "pointer",
  width: "100%",
};