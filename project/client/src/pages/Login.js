import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi"; // Your axios login function

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
       const data = await loginUser(email, password);

    // Save token and user info in localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    // Redirect based on role
    switch (data.user.role) {
      case "student":
        navigate("/student/dashboard");
        break;
      case "staff":
        navigate("/staff/dashboard");
        break;
      case "ta":
        navigate("/ta/dashboard");
        break;
      case "professor":
        navigate("/professor/dashboard");
        break;
      case "admin":
        navigate("/admin/dashboard");
        break;
      case "events_office":
        navigate("/EvenetsHome");
        break;
      default:
        navigate("/dashboard"); // fallback
        break;}
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#c8d9e6",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Poppins, Arial, sans-serif",
        textAlign: "center",
        padding: "20px",
      }}
    >
      {/* Title */}
      <h1
        style={{
          fontSize: "3rem",
          fontWeight: "700",
          color: "#111827",
          marginBottom: "50px",
        }}
      >
        Login
      </h1>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#f5efeb",
          borderRadius: "16px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          padding: "40px 30px",
          maxWidth: "400px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <input
          type="email"
          placeholder="GUC Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            fontSize: "1rem",
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            fontSize: "1rem",
          }}
        />

        <button
          type="submit"
          style={{
            backgroundColor: "#567c8d",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "12px 28px",
            fontSize: "1rem",
            fontWeight: "500",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#2f4156";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#567c8d";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Login
        </button>

        {error && (
          <p style={{ color: "red", fontWeight: "500", marginTop: "10px" }}>
            {error}
          </p>
        )}
      </form>

      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: "40px",
          backgroundColor: "#E5E7EB",
          color: "#111827",
          border: "none",
          borderRadius: "10px",
          padding: "12px 28px",
          fontSize: "1rem",
          fontWeight: "500",
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#D1D5DB";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#E5E7EB";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        ← Back to Home
      </button>
    </div>
  );
}
