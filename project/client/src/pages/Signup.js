import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Briefcase, ShoppingBag } from "lucide-react";
import StudentSignup from "./StudentSignup";
import StaffSignup from "./StaffSignup";
import VendorSignup from "./VendorSignup";
import Spline from "@splinetool/react-spline";
import EventityLogo from "../components/EventityLogo";

export default function Signup() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("student");

  const renderForm = () => {
    switch (activeTab) {
      case "student":
        return <StudentSignup />;
      case "staff":
        return <StaffSignup />;
      case "vendor":
        return <VendorSignup />;
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {/* LEFT SIDE: Spline Scene with Text Below */}
      <div
        style={{
          flex: "1",
          background: "#263545",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          minHeight: "100vh",
        }}
        className="hidden-mobile"
      >
        {/* --- LOGO PLACEMENT (Top Left) --- */}
        <div
          style={{
            position: "absolute",
            top: "40px",
            left: "60px",
            zIndex: 10,
          }}
        >
          <EventityLogo />
        </div>
        {/* ---------------------------------- */}

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <Spline scene="https://prod.spline.design/ruT0zmYhJkJ84mLn/scene.splinecode" />
        </div>

        {/* Text Content Below the Spline Scene */}
        <div
          style={{
            padding: "40px 60px 60px",
            maxWidth: "450px",
            zIndex: 2,
          }}
        >
          <h1
            style={{
              fontSize: "3.5rem",
              fontWeight: "700",
              lineHeight: "1.1",
              marginBottom: "20px",
              color: "white",
            }}
          >
            Join the <span style={{ color: "#8caabb" }}> community.</span>
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              opacity: 0.8,
              lineHeight: "1.6",
              color: "white",
            }}
          >
            Discover campus events, manage your activities, and connect with the
            best vendors in one place.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Form Area */}
      <div
        style={{
          flex: "1",
          backgroundColor: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          overflowY: "auto",
        }}
      >
        <div style={{ width: "100%", maxWidth: "480px" }}>
          {/* Mobile Logo */}
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: "700",
                color: "#1f2937",
                marginBottom: "8px",
              }}
            >
              Get Started
            </h2>
            <p style={{ color: "#64748b" }}>Create your account to continue</p>
          </div>

          {/* Segmented Control */}
          <div
            style={{
              background: "#e2e8f0",
              padding: "4px",
              borderRadius: "12px",
              display: "flex",
              marginBottom: "32px",
            }}
          >
            {[
              { id: "student", label: "Student", icon: User },
              { id: "staff", label: "Staff", icon: Briefcase },
              { id: "vendor", label: "Vendor", icon: ShoppingBag },
            ].map((role) => {
              const isActive = activeTab === role.id;
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => setActiveTab(role.id)}
                  style={{
                    flex: 1,
                    border: "none",
                    background: isActive ? "white" : "transparent",
                    color: isActive ? "#2f4156" : "#64748b",
                    padding: "10px",
                    borderRadius: "10px",
                    fontWeight: isActive ? "600" : "500",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    boxShadow: isActive ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <Icon size={16} />
                  {role.label}
                </button>
              );
            })}
          </div>

          {/* The Actual Form */}
          <div>{renderForm()}</div>

          {/* Footer Link */}
          <p
            style={{
              textAlign: "center",
              marginTop: "32px",
              color: "#64748b",
              fontSize: "0.95rem",
            }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: "#2f4156",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
