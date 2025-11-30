// Updated VendorSignup.js (both tax card & logo required)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3001";

export default function VendorSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    password: "",
  });

  const [taxCardFile, setTaxCardFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  setMessage("");
  setIsError(false);

  const { companyName, email, password } = formData;

  if (!companyName || !email || !password) {
    setMessage("⚠️ Please fill in all fields correctly.");
    setIsError(true);
    return;
  }

  // both required
  if (!taxCardFile || !logoFile) {
    setMessage("⚠️ Please upload both your tax card and company logo.");
    setIsError(true);
    return;
  }

  try {
    setLoading(true);

    // 1) REGISTER vendor (no token here)
    const registerRes = await fetch(`${API_BASE}/api/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        companyName,
        email,
        password,
        role: "vendor",
      }),
    });

    const registerData = await registerRes.json();

    if (!registerRes.ok) {
      if (registerData.error === "Email already registered") {
        setMessage(
          <>
            Email already registered.{" "}
            <span
              style={{
                color: "#10B981",
                textDecoration: "underline",
                cursor: "pointer",
              }}
              onClick={() => navigate("/login")}
            >
              Go to Login page
            </span>
          </>
        );
        setIsError(true);
      } else {
        throw new Error(registerData.error || "Signup failed");
      }
      return;
    }

    // 2) LOGIN to get token
    const loginRes = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      throw new Error(loginData.error || "Login failed after signup");
    }

    const token = loginData.token;
    if (!token) {
      throw new Error("No token returned from login");
    }

    localStorage.setItem("token", token);

    // 3) UPLOAD documents with token
    const form = new FormData();
    form.append("taxCard", taxCardFile);
    form.append("logo", logoFile);

    const docsRes = await fetch(`${API_BASE}/api/vendors/me/documents`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    const docsData = await docsRes.json();
    if (!docsRes.ok) {
      throw new Error(docsData.error || "Failed to upload documents");
    }

    // 4) Done
    setMessage(
      "✅ Signup successful!"
    );
    setIsError(false);

    setFormData({ companyName: "", email: "", password: "" });
    setTaxCardFile(null);
    setLogoFile(null);

    setTimeout(() => navigate("/login"), 2000);
  } catch (error) {
    console.error(error);
    setMessage(`⚠️ Error: ${error.message}`);
    setIsError(true);
  } finally {
    setLoading(false);
  }
};


  return (
    <div style={formContainerStyle}>
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
          placeholder="Business Email"
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

        {/* Tax Card (required) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.9rem", color: "#374151" }}>
            Tax Card (required)
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setTaxCardFile(e.target.files[0] || null)}
            style={fileInputStyle}
          />
          <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            Upload a clear image or PDF of your official tax card.
          </span>
        </div>

        {/* Logo (required) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.9rem", color: "#374151" }}>
            Company Logo (required)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files[0] || null)}
            style={fileInputStyle}
          />
          <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            Upload your brand logo (PNG/JPEG) to appear on the platform.
          </span>
        </div>

        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? "Signing up..." : "Sign Up"}
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

// Styles
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
  fontSize: "2.2rem",
  color: "#111827",
  marginBottom: "30px",
  fontWeight: "700",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  width: "100%",
};

const inputStyle = {
  padding: "15px 20px",
  borderRadius: "12px",
  border: "2px solid #D1D5DB",
  fontSize: "1.1rem",
  outline: "none",
  transition: "border-color 0.3s ease",
};

const fileInputStyle = {
  padding: "10px 12px",
  borderRadius: "10px",
  border: "2px solid #D1D5DB",
  fontSize: "0.95rem",
  backgroundColor: "#F9FAFB",
};

const buttonStyle = {
  backgroundColor: "#567c8d",
  color: "white",
  padding: "15px",
  border: "none",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "1.1rem",
  transition: "all 0.3s ease",
};
