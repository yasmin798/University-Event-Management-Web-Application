// client/src/components/FormNavBar.jsx
import { Link, useNavigate } from "react-router-dom";

export default function FormNavBar() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <header className="nav nav-xl">
      <Link to="/events" className="brand">
        Events Office
      </Link>

      <div className="nav-actions">
        <button className="logout-btn" onClick={handleLogout}>
          <span>Log out</span>
        </button>
      </div>
    </header>
  );
}
