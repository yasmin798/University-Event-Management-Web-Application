import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function VendorSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.companyName || !formData.email || !formData.password) {
      setMessage("Please fill in all fields correctly.");
      return;
    }

    console.log("Vendor Signup Data:", formData);
    setMessage("Signup successful!");
  };

  return (
    <div style={containerStyle}>
      <div style={formBoxStyle}>
        <h1 style={titleStyle}>Vendor Signup</h1>

        <form onSubmit={handleSubmit} style={formStyle}>
          <input
            type="text"
            name="companyName"
            placeholder="Company Name"
            value={formData.companyName}
            onChange={handleChange}
            style={inputStyle}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            style={inputStyle}
          />

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

// Styles
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
  backgroundColor: "#6366F1",
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
