import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function VendorSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    password: "",
    roleSpecificId: "",
  });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.companyName ||
      !formData.email ||
      !formData.password ||
      !formData.roleSpecificId
    ) {
      setMessage("⚠️ Please fill in all fields correctly.");
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
          companyName: formData.companyName,
          email: formData.email,
          password: formData.password,
          roleSpecificId: formData.roleSpecificId,
          role: "vendor",
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

      setMessage("✅ Signup successful! Redirecting to login page...");
      setIsError(false);
      setFormData({
        firstName: "",
        lastName: "",
        companyName: "",
        email: "",
        password: "",
        roleSpecificId: "",
      });

      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      console.error("Signup error:", error);
      setMessage(`⚠️ Error: ${error.message}`);
      setIsError(true);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={formBoxStyle}>
        <h1 style={titleStyle}>Vendor Signup</h1>

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
          <input
            type="text"
            name="roleSpecificId"
            placeholder="Vendor ID"
            value={formData.roleSpecificId}
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
              color: isError ? "red" : "green",
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
  backgroundColor: "#c8d9e6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "Poppins, Arial, sans-serif",
  padding: "20px",
};

const formBoxStyle = {
  background: "#f5efeb",
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
  backgroundColor: "#567c8d",
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