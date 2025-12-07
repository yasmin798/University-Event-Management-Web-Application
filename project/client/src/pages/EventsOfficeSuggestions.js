// client/src/pages/EventsOfficeSuggestions.js
import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import NotificationsDropdown from "../components/NotificationsDropdown";
import { MessageCircle, Mail, Calendar, User } from "lucide-react";

const EVENT_TYPES = ["ALL", "TRIP", "WORKSHOP", "BAZAAR", "BOOTH", "CONFERENCE"];

const typeLabel = (t) => {
  const map = {
    TRIP: "Trip",
    WORKSHOP: "Workshop",
    BAZAAR: "Bazaar",
    BOOTH: "Booth",
    CONFERENCE: "Conference",
  };
  return map[t] || t || "Unknown";
};

const formatDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function EventsOfficeSuggestions() {
  // Sidebar still expects these props, so we keep a dummy filter
  const [filter, setFilter] = useState("All");

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("ALL");

  const [refreshKey, setRefreshKey] = useState(0); // simple manual refresh flag

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        const params = new URLSearchParams();
        if (eventTypeFilter !== "ALL") {
          params.append("eventType", eventTypeFilter);
        }

        const res = await fetch(
          `/api/suggestions${params.toString() ? `?${params.toString()}` : ""}`,
          {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                }
              : { "Content-Type": "application/json" },
          }
        );

        if (!res.ok) {
          let msg = "Failed to load student suggestions.";
          try {
            const data = await res.json();
            if (data?.message) msg = data.message;
          } catch (_) {}
          setError(msg);
          setSuggestions([]);
          return;
        }

        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        setError("Network error while loading suggestions.");
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [eventTypeFilter, refreshKey]);

  const totalSuggestions = suggestions.length;
  const lastUpdated =
    suggestions.length > 0 ? formatDateTime(suggestions[0].createdAt) : "—";

  return (
    <div
      className="events-theme"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      {/* Left sidebar (Events Office) */}
      <Sidebar filter={filter} setFilter={setFilter} />

      {/* Main content */}
      <main style={{ flex: 1, marginLeft: "260px", padding: "0 24px 24px" }}>
        {/* Sticky header */}
        <header
          style={{
            marginLeft: "-24px",
            marginRight: "-24px",
            width: "calc(100% + 48px)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--card)",
            borderRadius: "0 0 16px 16px",
            boxShadow: "var(--shadow)",
            padding: "16px 24px",
            marginBottom: "20px",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          {/* LEFT: Title + subtitle */}
          <div>
            <h1
              style={{
                color: "var(--navy)",
                fontWeight: 800,
                marginBottom: "4px",
                fontSize: "24px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <MessageCircle size={22} />
              Student Suggestions
            </h1>
            <p className="eo-sub" style={{ margin: 0 }}>
              See what students want for upcoming trips, workshops, bazaars,
              booths and conferences.
            </p>
          </div>

          {/* RIGHT: Filters + actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            {/* Event type filter */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                flexWrap: "wrap",
              }}
            >
              {EVENT_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setEventTypeFilter(t)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "999px",
                    border:
                      eventTypeFilter === t
                        ? "1px solid #567c8d"
                        : "1px solid #d0d7e2",
                    background:
                      eventTypeFilter === t ? "#567c8d" : "transparent",
                    color: eventTypeFilter === t ? "white" : "#344054",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t === "ALL" ? "All Types" : typeLabel(t)}
                </button>
              ))}
            </div>

            {/* Refresh button */}
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="btn-primary"
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                fontSize: "13px",
              }}
            >
              Refresh
            </button>

            {/* Notifications (same component you use in EventsHome) */}
            <NotificationsDropdown />
          </div>
        </header>

        {/* Top stats */}
        <section
          style={{
            marginBottom: "20px",
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div className="card" style={{ flex: "0 0 240px", padding: "16px" }}>
            <p
              style={{
                fontSize: "12px",
                textTransform: "uppercase",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              Total Suggestions
            </p>
            <p
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "var(--navy)",
                margin: 0,
              }}
            >
              {totalSuggestions}
            </p>
          </div>

          <div className="card" style={{ flex: "0 0 240px", padding: "16px" }}>
            <p
              style={{
                fontSize: "12px",
                textTransform: "uppercase",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              Last Updated
            </p>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--navy)",
                margin: 0,
              }}
            >
              {lastUpdated}
            </p>
          </div>
        </section>

        {/* Content area */}
        {loading ? (
          <p style={{ color: "var(--text-muted)", marginTop: "20px" }}>
            Loading student suggestions…
          </p>
        ) : error ? (
          <p
            style={{
              color: "#b91c1c",
              background: "#fee2e2",
              borderRadius: "8px",
              padding: "10px 12px",
              marginTop: "20px",
            }}
          >
            {error}
          </p>
        ) : suggestions.length === 0 ? (
          <p style={{ color: "var(--text-muted)", marginTop: "20px" }}>
            No suggestions found for this filter.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "20px",
            }}
          >
            {suggestions.map((s) => (
              <article
                key={s._id}
                className="card"
                style={{
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginBottom: "2px",
                      }}
                    >
                      {formatDateTime(s.createdAt)}
                    </div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "var(--navy)",
                      }}
                    >
                      {typeLabel(s.eventType)} suggestion
                    </h3>
                  </div>
                  <span
                    className="chip"
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {s.eventType}
                  </span>
                </div>

                {/* Suggestion text */}
                <div
                  style={{
                    background: "#f9fafb",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    fontSize: "14px",
                    color: "#374151",
                  }}
                >
                  {s.suggestion}
                </div>

                {/* Student info */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    fontSize: "13px",
                    color: "#4b5563",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <User size={14} />
                    <span>Student ID: {s.studentId || "—"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Mail size={14} />
                    <span>{s.suggestionEmail || "No email"}</span>
                  </div>
                </div>

                {/* Extra fields (optional) */}
                {(s.extraDetails || s.preferredTimeframe) && (
                  <div
                    style={{
                      marginTop: "6px",
                      borderTop: "1px solid #e5e7eb",
                      paddingTop: "8px",
                      fontSize: "12px",
                      color: "#6b7280",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    {s.extraDetails && (
                      <div>
                        <strong>Extra details: </strong>
                        {s.extraDetails}
                      </div>
                    )}
                    {s.preferredTimeframe && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Calendar size={13} />
                        <span>Preferred time: {s.preferredTimeframe}</span>
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
