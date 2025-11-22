// client/src/pages/MyApplicationsByStatus.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "../events.theme.css";
import { CheckCircle } from "lucide-react";

const API_ORIGIN = "http://localhost:3001";

export default function MyApplicationsByStatus() {
  const { status } = useParams(); // 'pending' or 'rejected'
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [bazaars, setBazaars] = useState([]);
  const [booths, setBooths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Detect logged-in user or use manual input
  useEffect(() => {
    try {
      const raw =
        localStorage.getItem("user") || localStorage.getItem("currentUser");
      if (raw) {
        const u = JSON.parse(raw);
        if (u && u.email) {
          setEmail(u.email);
          return;
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    const fetchApps = async () => {
      if (!email) return;
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${API_ORIGIN}/api/vendor/applications?email=${encodeURIComponent(
            email
          )}&status=${status}`
        );
        if (!res.ok) throw new Error("Failed to fetch applications");
        const data = await res.json();
        setBazaars(data.bazaars || []);
        setBooths(data.booths || []);
      } catch (err) {
        console.error(err);
        setError("Could not load your applications");
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [email, status]);

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const handlePayment = (applicationId, type) => {
  navigate(`/payment?appId=${applicationId}&type=${type}`);
};
  return (
    <div className="events-theme">
      <div className="container">
        {/* Title + Back (same style as BazaarForm) */}
        <div className="eo-head-row">
          <h1>My {capitalize(status)} Applications</h1>
          <button
            type="button"
            className="btn btn-outline eo-back"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            Back
          </button>
        </div>

        {/* Status tabs (left as-is; you can restyle later if desired) */}
        <div className="mb-4 flex gap-3">
          <Link
            to="/my-applications/accepted"
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Accepted
          </Link>
          <Link
            to="/my-applications/pending"
            className="bg-yellow-500 text-white px-4 py-2 rounded"
          >
            Pending
          </Link>
          <Link
            to="/my-applications/rejected"
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Rejected
          </Link>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <>
            <section className="mb-8">
  <h2 className="text-xl font-semibold mb-3">
    Bazaar Applications
  </h2>
  {bazaars.length === 0 ? (
    <p>No {status} bazaar applications found.</p>
  ) : (
    <ul className="space-y-3">
      {/* Bazaar Applications */}
{bazaars.map((app) => (
  <li key={app._id} className="bg-white p-4 rounded shadow">
    <div className="font-semibold">{app.bazaar?.title || "Bazaar"}</div>
    <div className="text-sm text-gray-600">
      {app.bazaar?.location} • Booth Size: {app.boothSize}
    </div>
    <div className="mt-2 text-sm">
      <strong>Status:</strong> <span className="text-green-600 font-medium">Accepted</span>
    </div>

    {/* Pay Button Logic */}
    <div className="mt-4">
      {app.paid ? (
        <button disabled className="bg-emerald-100 text-emerald-700 font-medium py-2 px-6 rounded-lg cursor-not-allowed flex items-center gap-2">
          <CheckCircle size={18} />
          Already Paid
        </button>
      ) : (
        <button
          onClick={() => handlePayment(app._id, "bazaar")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-lg transition shadow-md"
        >
          Pay Now
        </button>
      )}
    </div>
  </li>
))}
    </ul>
  )}
</section>

<section>
  <h2 className="text-xl font-semibold mb-3">Booth Applications</h2>
  {booths.length === 0 ? (
    <p>No {status} booth applications found.</p>
  ) : (
    <ul className="space-y-3">
      {/* Booth Applications */}
{booths.map((b) => (
  <li key={b._id} className="bg-white p-4 rounded shadow">
    <div className="font-semibold">{b.vendorName || "Booth Application"}</div>
    <div className="text-sm text-gray-600">
      <strong>Location:</strong> {b.platformSlot || "—"} •{" "}
      <strong>Duration:</strong> {b.durationWeeks || "—"} weeks
    </div>
    <div className="mt-2 text-sm">
      <strong>Status:</strong> <span className="text-green-600 font-medium">Accepted</span>
    </div>

    <div className="mt-4">
      {b.paid ? (
        <button disabled className="bg-emerald-100 text-emerald-700 font-medium py-2 px-6 rounded-lg cursor-not-allowed flex items-center gap-2">
          <CheckCircle size={18} />
          Already Paid
        </button>
      ) : (
        <button
          onClick={() => handlePayment(b._id, "booth")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-lg transition shadow-md"
        >
          Pay Now
        </button>
      )}
    </div>
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
