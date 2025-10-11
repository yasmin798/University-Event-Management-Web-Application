// client/src/components/NavBar.jsx
import { useNavigate } from "react-router-dom";

export default function NavBar({ bleed = false }) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <header className={`nav ${bleed ? "nav--bleed" : ""}`}>
      {/* Non-clickable title */}
      <span className="brand">Events Office</span>

      <div className="nav-actions">
        <button className="logout-btn" onClick={handleLogout}>
          <span aria-hidden>↪</span>
          <span>Log out</span>
        </button>
      </div>
    </header>
  );
}
