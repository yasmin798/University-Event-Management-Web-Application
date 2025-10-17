// client/src/pages/VendorsPage.js
import React, { useState } from "react";
import { Link } from "react-router-dom";

const VendorsPage = () => {
  const [bazaars, setBazaars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchBazaars = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/api/bazaars");
      if (!res.ok) throw new Error("Failed to fetch bazaars");
      const data = await res.json();
      const list = data.items || data || [];
      setBazaars(list);
      if (list.length === 0) setError("No upcoming bazaars found.");
    } catch (err) {
      console.error(err);
      setError("Error fetching bazaars. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Vendors Portal
      </h1>

      <div className="flex justify-center mb-8">
        <button
          onClick={fetchBazaars}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-all"
        >
          Show Upcoming Bazaars
        </button>
      </div>
      <Link to="/my-applications" className="...">My Applications</Link>


      {loading && (
        <p className="text-center text-gray-500 font-medium">Loading...</p>
      )}

      {error && !loading && (
        <p className="text-center text-red-500 font-medium">{error}</p>
      )}

      {!loading && !error && bazaars.length > 0 && (
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          {bazaars.map((bazaar) => (
            <div
              key={bazaar._id}
              className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-all border border-gray-100"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {bazaar.title}
              </h2>
              <p className="text-gray-600 mb-1">
                <strong>Location:</strong> {bazaar.location}
              </p>
              <p className="text-gray-600 mb-1">
                <strong>Start:</strong>{" "}
                {new Date(bazaar.startDateTime).toLocaleString()}
              </p>
              <p className="text-gray-600 mb-1">
                <strong>End:</strong>{" "}
                {new Date(bazaar.endDateTime).toLocaleString()}
              </p>
              <p className="text-gray-600 mb-3">
                <strong>Description:</strong> {bazaar.shortDescription || "N/A"}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                <strong>Status:</strong>{" "}
                <span className="capitalize">{bazaar.status}</span>
              </p>

              {/* Apply Buttons */}
              <div className="flex gap-3 justify-center">
                <Link
                  to={`/apply/${bazaar._id}`}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium shadow-md"
                >
                  Apply (General)
                </Link>

                <Link
                  to={`/apply-booth/${bazaar._id}`}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium shadow-md"
                >
                  Apply for Booth
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorsPage;
