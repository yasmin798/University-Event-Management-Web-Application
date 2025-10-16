// client/src/pages/VendorRequests.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import NavBar from "../components/NavBar";

export default function VendorRequests() {
  const { id: bazaarId } = useParams();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch vendor requests for this bazaar
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:3001/api/bazaar-applications/${bazaarId}`
      );

      console.log("Fetched requests:", res.data); // Debugging line

      // Adjust to handle both possible structures
      setRequests(res.data.requests || res.data || []);
    } catch (err) {
      console.error("Failed to load vendor requests:", err);
      setError("Failed to load vendor requests. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [bazaarId]);

  // Handle Accept/Reject actions
  const updateStatus = async (requestId, status) => {
    try {
      await axios.patch(
        `http://localhost:3001/api/admin/bazaar-vendor-requests/${requestId}`,
        { status }
      );
      fetchRequests(); // Refresh after update
    } catch (err) {
      console.error(`Failed to ${status} vendor request:`, err);
      alert(`Failed to ${status} vendor request.`);
    }
  };

  return (
    <div className="events-theme">
      <div className="container">
        <NavBar bleed />

        {/* Header */}
        <div className="eo-head-row">
          <h1>Vendor Participation Requests</h1>
          <button
            type="button"
            className="eo-back"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            Back
          </button>
        </div>

        {/* Loading/Error States */}
        {loading ? (
          <p>Loading vendor requests...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : requests.length === 0 ? (
          <p>No vendor requests for this bazaar.</p>
        ) : (
          <ul className="space-y-4">
            {requests.map((req) => {
  // Prefer attendees[0] (your form saves name/email there)
  const firstAtt = Array.isArray(req.attendees) ? req.attendees[0] : null;
  const vendorName = firstAtt?.name || "Unknown Vendor";
  const vendorEmail = firstAtt?.email || "No email provided";
  const boothSize = req.boothSize || "N/A";

  // Build a friendly description from available data
  const attendeesList = Array.isArray(req.attendees)
    ? req.attendees.map(a => `${a.name} <${a.email}>`).join(", ")
    : "";
  const description = req.description || `Booth: ${boothSize}. Attendees: ${attendeesList}` || "No description provided.";

  const status = (req.status || "pending").toLowerCase();

  return (
    <li
      key={req._id}
      className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
    >
      <div className="mb-2">
        <strong>Vendor Name:</strong> {vendorName}
      </div>
      <div className="mb-2">
        <strong>Email:</strong> {vendorEmail}
      </div>
      <div className="mb-2">
        <strong>Description:</strong> {description}
      </div>
      <div className="mb-2">
        <strong>Status:</strong>{" "}
        <span style={{
          color: status === "accepted" ? "green" : status === "rejected" ? "red" : "gray",
          fontWeight: "bold"
        }}>
          {status}
        </span>
      </div>

      {status === "pending" && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => updateStatus(req._id, "accepted")}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            Accept
          </button>
          <button
            onClick={() => updateStatus(req._id, "rejected")}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Reject
          </button>
        </div>
      )}
    </li>
  );
})}

          </ul>
        )}
      </div>
    </div>
  );
}
