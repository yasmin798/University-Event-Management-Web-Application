import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TASignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    taId: "",
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
      const regex = /^[a-zA-Z0-9._%+-]+@guc\.edu\.eg$/;
      setEmailError(regex.test(value) ? "" : "❌ Wrong email format, should be @guc.edu.eg");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.taId || !formData.email || !formData.password) {
      setMessage("⚠️ Please fill in all fields.");
      setIsError(true);
      return;
    }

    if (emailError) {
      setMessage("⚠️ Please fix your email format.");
      setIsError(true);
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          roleSpecificId: formData.taId,
          email: formData.email,
          password: formData.password,
          role: "ta",
        }),
      });

      const data = await response.json();
      console.log("📦 Server Response:", data);

      if (!response.ok) {
        setMessage(`❌ ${data.error || "Signup failed"}`);
        setIsError(true);
        return;
      }

      setMessage(data.message || "✅ Signup successful!");
      setIsError(false);

      setFormData({ firstName: "", lastName: "", taId: "", email: "", password: "" });
    } catch (error) {
      console.error("Signup error:", error);
      setMessage(`❌ ${error.message}`);
      setIsError(true);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={formBoxStyle}>
        <h1 style={titleStyle}>TA Signup</h1>

        <form onSubmit={handleSubmit} style={formStyle}>
          <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} style={inputStyle} />
          <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} style={inputStyle} />
          <input name="taId" placeholder="TA ID" value={formData.taId} onChange={handleChange} style={inputStyle} />
          <input
            name="email"
            type="email"
            placeholder="Email (e.g. malak@guc.edu.eg)"
            value={formData.email}
            onChange={handleChange}
            style={{ ...inputStyle, borderColor: emailError ? "red" : "#D1D5DB" }}
          />
          {emailError && <p style={{ color: "red" }}>{emailError}</p>}
          <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} style={inputStyle} />

          <button type="submit" style={buttonStyle}>Sign Up</button>
        </form>

        {message && <p style={{ marginTop: "15px", textAlign: "center", color: isError ? "red" : "green" }}>{message}</p>}

        <button onClick={() => navigate("/signup")} style={backButtonStyle}>← Back</button>
      </div>
    </div>
  );
}

// Styles
const containerStyle = { minHeight: "100vh", backgroundColor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Poppins, Arial, sans-serif" };
const formBoxStyle = { background: "white", borderRadius: "16px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", padding: "40px", width: "100%", maxWidth: "400px" };
const titleStyle = { textAlign: "center", fontSize: "2rem", color: "#111827", marginBottom: "30px" };
const formStyle = { display: "flex", flexDirection: "column", gap: "15px" };
const inputStyle = { padding: "10px 14px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "1rem", outline: "none" };
const buttonStyle = { backgroundColor: "#EC4899", color: "white", padding: "12px", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" };
const backButtonStyle = { marginTop: "25px", backgroundColor: "#E5E7EB", color: "#111827", border: "none", borderRadius: "10px", padding: "10px 20px", fontSize: "0.95rem", fontWeight: "500", cursor: "pointer", width: "100%" };
