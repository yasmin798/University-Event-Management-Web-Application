import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { loginUser } from "../api/authApi";
import Spline from "@splinetool/react-spline";
import EventityLogo from "../components/EventityLogo";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await loginUser(email, password);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

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
          navigate("/admin");
          break;
        case "events_office":
          navigate("/events");
          break;
        default:
          navigate("/vendors");
          break;
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
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
            Welcome <span style={{ color: "#8caabb" }}>Back.</span>
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              opacity: 0.8,
              lineHeight: "1.6",
              color: "white",
            }}
          >
            Log in to access your dashboard, manage upcoming events, and stay
            connected with the campus community.
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
        }}
      >
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div style={{ marginBottom: "30px" }}>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: "700",
                color: "#1f2937",
                marginBottom: "8px",
              }}
            >
              Log In
            </h2>
            <p style={{ color: "#64748b" }}>
              Enter your credentials to access your account.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  color: "#374151",
                }}
              >
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={18}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                  }}
                />
                <input
                  type="email"
                  placeholder="GUC Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 12px 12px 40px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    fontSize: "1rem",
                    backgroundColor: "white",
                    outline: "none",
                    transition: "border 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#2f4156")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  color: "#374151",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={18}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                  }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 12px 12px 40px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    fontSize: "1rem",
                    backgroundColor: "white",
                    outline: "none",
                    transition: "border 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#2f4156")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  backgroundColor: "#fee2e2",
                  color: "#dc2626",
                  fontSize: "0.9rem",
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "10px",
                backgroundColor: "#2f4156",
                color: "white",
                border: "none",
                borderRadius: "10px",
                padding: "14px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: loading ? "wait" : "pointer",
                boxShadow: "0 4px 6px rgba(47, 65, 86, 0.2)",
                transition: "all 0.2s ease",
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={(e) =>
                !loading && (e.target.style.transform = "translateY(-1px)")
              }
              onMouseLeave={(e) =>
                !loading && (e.target.style.transform = "translateY(0)")
              }
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              marginTop: "30px",
              color: "#64748b",
              fontSize: "0.95rem",
            }}
          >
            Don't have an account?{" "}
            <Link
              to="/signup"
              style={{
                color: "#2f4156",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
