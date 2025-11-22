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
const [loadingPayment, setLoadingPayment] = useState(null);
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
  setLoadingPayment(applicationId);
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
{/* ========== BAZAAR APPLICATIONS ========== */}
{bazaars.map((app) => (
  <li key={app._id} className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
    <h3 className="font-bold text-lg text-gray-800">{app.bazaar?.title || "Bazaar Booth"}</h3>
    <p className="text-sm text-gray-600 mt-1">
      {app.bazaar?.location} • Size: {app.boothSize}
    </p>

    <div className="mt-4 flex items-center gap-3">
      {/* ← THIS IS THE MAGIC LINE */}
      <span className="text-sm font-medium text-gray-700">Status:</span>
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
        app.status === "accepted" ? "bg-green-100 text-green-800" :
        app.status === "rejected" ? "bg-red-100 text-red-800" :
        "bg-yellow-100 text-yellow-800"
      }`}>
        {app.status.toUpperCase()}
      </span>
    </div>

    {/* PAYMENT BUTTON LOGIC – CLEAN & BEAUTIFUL VERSION */}
    <div className="mt-5">
      {app.paid ? (
        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-5 py-3 rounded-lg font-semibold">
          <CheckCircle size={22} />
          Already Paid
        </div>
      ) : app.paymentDeadline && new Date() > new Date(app.paymentDeadline) ? (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 px-5 py-3 rounded-lg font-semibold">
          Payment Expired
        </div>
      ) : app.status === "accepted" ? (
        <button
          onClick={() => handlePayment(app._id, "bazaar")}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transform transition hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loadingPayment === app._id}
        >
          {loadingPayment === app._id ? "Processing..." : "Pay Now"}
        </button>
      ) : null}
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
{/* ========== BOOTH APPLICATIONS ========== */}
{booths.map((b) => (
  <li key={b._id} className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
    <h3 className="font-bold text-lg text-gray-800">{b.vendorName || "Platform Booth"}</h3>
    <p className="text-sm text-gray-600 mt-1">
      Location: {b.platformSlot || "—"} • Duration: {b.durationWeeks} weeks
    </p>

    <div className="mt-4 flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700">Status:</span>
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
        b.status === "accepted" ? "bg-green-100 text-green-800" :
        b.status === "rejected" ? "bg-red-100 text-red-800" :
        "bg-yellow-100 text-yellow-800"
      }`}>
        {b.status.toUpperCase()}
      </span>
    </div>

    {/* PAYMENT BUTTON – SAME LOGIC */}
    <div className="mt-5">
      {b.paid ? (
        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-5 py-3 rounded-lg font-semibold">
          <CheckCircle size={22} />
          Already Paid
        </div>
      ) : b.paymentDeadline && new Date() > new Date(b.paymentDeadline) ? (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 px-5 py-3 rounded-lg font-semibold">
          Payment Expired
        </div>
      ) : b.status === "accepted" ? (
        <button
          onClick={() => handlePayment(b._id, "booth")}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transform transition hover:scale-105 disabled:opacity-60"
          disabled={loadingPayment === b._id}
        >
          {loadingPayment === b._id ? "Processing..." : "Pay Now"}
        </button>
      ) : null}
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
