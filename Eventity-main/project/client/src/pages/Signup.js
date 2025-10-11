import React from "react";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();

  const roles = [
    { title: "Student", color: "#4F46E5" },
    { title: "Staff", color: "#10B981" },
    { title: "Professor", color: "#F59E0B" },
    { title: "TA", color: "#EC4899" },
    { title: "Vendor", color: "#6366F1" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F3F4F6",
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
        Signing up as a:
      </h1>

      {/* Role Squares */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "25px",
          maxWidth: "900px",
          width: "100%",
        }}
      >
        {roles.map((role, index) => (
          <div
            key={index}
            style={{
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
              padding: "30px 20px",
              transition: "transform 0.3s, box-shadow 0.3s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)";
              e.currentTarget.style.boxShadow =
                "0 6px 20px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 10px rgba(0, 0, 0, 0.1)";
            }}
            onClick={() => navigate(`/signup/${role.title.toLowerCase()}`)}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "12px",
                backgroundColor: role.color,
                margin: "0 auto 15px",
              }}
            ></div>
            <h2
              style={{
                fontSize: "1.3rem",
                fontWeight: "600",
                color: "#1F2937",
              }}
            >
              {role.title}
            </h2>
          </div>
        ))}
      </div>

      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: "60px",
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
