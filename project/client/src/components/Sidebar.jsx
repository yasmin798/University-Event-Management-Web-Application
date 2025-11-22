import React, { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();

  // Buttons that navigate to filtered events page
  const filterMenu = [
    ["All Events", "All"],
    ["Workshops", "WORKSHOP"],
    ["Bazaars", "BAZAAR"],
    ["Trips", "TRIP"],
    ["Conferences", "CONFERENCE"],
    ["Booths", "BOOTH"],
  ];

  // Buttons that go to other pages (static)
  const baseNavigation = [
    ["Gym Sessions", "/gym-sessions"],
    ["Vendor Booths", "/vendor-requests-booths"],
    ["Attendees Report", "/reports/attendees"],
    ["Sales Report", "/reports/sales"],
  ];

  const [navigationMenu, setNavigationMenu] = useState(baseNavigation);

  // Roles that should see the Loyalty Partners button
  const allowedRoles = new Set(["student", "staff", "ta", "professor", "events_office", "admin"]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user") || localStorage.getItem("currentUser");
      if (!raw) return setNavigationMenu(baseNavigation);
      const u = JSON.parse(raw);
      const role = u && u.role ? String(u.role).toLowerCase() : null;
      if (role && allowedRoles.has(role)) {
        // insert Loyalty Partners after Vendor Booths
        const menu = [...baseNavigation];
        // place loyalty link before reports
        menu.splice(2, 0, ["Loyalty Partners", "/vendors/loyalty"]);
        setNavigationMenu(menu);
      } else {
        setNavigationMenu(baseNavigation);
      }
    } catch (e) {
      setNavigationMenu(baseNavigation);
    }
  }, []);

  return (
    <aside
      className="sidebar"
      style={{
        width: "260px",
        backgroundColor: "var(--navy)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        boxShadow: "4px 0 12px rgba(0,0,0,0.1)",
        zIndex: 50,
      }}
    >
      {/* LOGO */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "20px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "var(--teal)",
            }}
          />
          <h2 style={{ fontSize: "22px", fontWeight: 800 }}>EventHub</h2>
          {/* header right area (reserved) */}
        </div>

        {/* FILTER BUTTONS */}
        <nav style={{ marginTop: "20px" }}>
          {filterMenu.map(([label, type]) => (
            <button
              key={label}
              onClick={() =>
                navigate(type === "All" ? "/events" : `/events?filter=${type}`)
              }
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: "white",
                textAlign: "left",
                padding: "12px 24px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              • {label}
            </button>
          ))}

          {/* STATIC NAVIGATION */}
          {navigationMenu.map(([label, route]) => (
            <button
              key={label}
              onClick={() => navigate(route)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: "white",
                textAlign: "left",
                padding: "12px 24px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              • {label}
            </button>
          ))}
        </nav>
      </div>

      {/* LOGOUT */}
      <div
        style={{
          padding: "20px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <button
          className="btn-danger"
          onClick={() => navigate("/")}
          style={{ width: "100%" }}
        >
          <LogOut size={18} style={{ marginRight: "6px" }} />
          Logout
        </button>
      </div>
    </aside>
  );
}
