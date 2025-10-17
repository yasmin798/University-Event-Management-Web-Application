// client/src/pages/MyApplications.jsx
import React, { useEffect, useState } from "react";

// change if backend origin differs
const API_ORIGIN = "http://localhost:3001";

export default function MyApplications() {
  const [email, setEmail] = useState(""); // vendor email source
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bazaars, setBazaars] = useState([]);
  const [booths, setBooths] = useState([]);

  // Try to detect logged-in user:
  // 1) prefer server /api/me if you have it
  // 2) fallback to localStorage "user" JSON (adjust if your app stores differently)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Try /api/me
        const meRes = await fetch(`${API_ORIGIN}/api/me`);
        if (meRes.ok) {
          const me = await meRes.json();
          if (me && me.email) {
            setEmail(me.email);
            return;
          }
        }
      } catch (e) {
        // ignore
      }

      // fallback localStorage
      try {
        const raw = localStorage.getItem("user") || localStorage.getItem("currentUser");
        if (raw) {
          const u = JSON.parse(raw);
          if (u && u.email) {
            setEmail(u.email);
            return;
          }
        }
      } catch (e) {
        // ignore
      }

      // If still empty leave it for manual entry
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchApps = async () => {
      if (!email) return;
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${API_ORIGIN}/api/vendor/applications?email=${encodeURIComponent(email)}&status=accepted`
        );
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || "Failed to fetch applications");
        }
        const data = await res.json();
        setBazaars(Array.isArray(data.bazaars) ? data.bazaars : []);
        setBooths(Array.isArray(data.booths) ? data.booths : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load your applications. Try again or enter email below.");
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [email]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">My Accepted Applications</h1>

        {!email && (
          <div className="mb-4 p-4 bg-white rounded shadow">
            <p className="mb-2">We couldn't detect your email automatically. Enter it to view your accepted apps:</p>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your vendor email"
              className="p-2 border rounded w-full"
            />
          </div>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <>
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Accepted Bazaar Applications</h2>
              {bazaars.length === 0 ? (
                <p>No accepted bazaar applications found.</p>
              ) : (
                <ul className="space-y-3">
                  {bazaars.map((app) => (
                    <li key={app._id} className="bg-white p-4 rounded shadow">
                      <div className="font-semibold">{(app.bazaar && app.bazaar.title) || "Bazaar"}</div>
                      <div className="text-sm text-gray-600">
                        {(app.bazaar && app.bazaar.location) || ""}
                        {" • "}
                        {app.bazaar && app.bazaar.startDateTime ? new Date(app.bazaar.startDateTime).toLocaleString() : ""}
                        {" - "}
                        {app.bazaar && app.bazaar.endDateTime ? new Date(app.bazaar.endDateTime).toLocaleString() : ""}
                      </div>
                      <div className="mt-2">
                        <strong>Attendees:</strong>{" "}
                        {Array.isArray(app.attendees) ? app.attendees.map(a => `${a.name} (${a.email})`).join(", ") : ""}
                      </div>
                      <div className="mt-1"><strong>Booth size:</strong> {app.boothSize}</div>
                      <div className="mt-1 text-sm text-green-700"><strong>Status:</strong> {app.status}</div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Accepted Booth Applications</h2>
              {booths.length === 0 ? (
                <p>No accepted booth applications found.</p>
              ) : (
                <ul className="space-y-3">
                  {booths.map((b) => (
                    <li key={b._id} className="bg-white p-4 rounded shadow">
                      <div className="font-semibold">{b.vendorName || b.vendorCompany || "Booth Application"}</div>
                      <div className="text-sm text-gray-600">
                        <strong>Location:</strong> {b.location || b.platformSlot || "—"}{" • "}
                        <strong>Duration:</strong> {b.duration || b.durationWeeks || "—"}{" weeks"}
                      </div>
                      <div className="mt-1"><strong>Booth size:</strong> {b.boothSize || "—"}</div>
                      <div className="mt-1 text-sm text-green-700"><strong>Status:</strong> {b.status}</div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
