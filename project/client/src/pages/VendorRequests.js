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
  const [processingId, setProcessingId] = useState(null); // which request is being updated

  // helper to extract bazaar id from various shapes
  const getBazaarId = (req) => {
    if (!req) return null;
    if (req.bazaar && typeof req.bazaar === "string") return req.bazaar;
    if (req.bazaar && req.bazaar._id) return req.bazaar._id;
    if (req.bazaarId) return req.bazaarId;
    return null;
  };

  // Fetch vendor requests for this bazaar
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      // Try multiple possible backend shapes (most robust)
      // 1) GET /api/bazaar-applications/bazaar/:bazaarId
      // 2) GET /api/bazaar-applications?bazaar=...
      // 3) GET /api/bazaar-applications and filter client-side
      const attempts = [
        `http://localhost:3001/api/bazaar-applications/bazaar/${bazaarId}`,
        `http://localhost:3001/api/bazaar-applications?bazaar=${bazaarId}`,
        `http://localhost:3001/api/bazaar-applications`,
      ];

      let res = null;
      let data = null;
      for (let url of attempts) {
        try {
          res = await axios.get(url);
          if (res && res.status >= 200 && res.status < 300) {
            data = res.data;
            break;
          }
        } catch (e) {
          // try next
          console.warn("Fetch attempt failed:", url, e.message);
          continue;
        }
      }

      if (!data) {
        throw new Error("No data returned from any application endpoint");
      }

      // Normalize to array
      let arr = [];
      if (Array.isArray(data)) arr = data;
      else if (Array.isArray(data.requests)) arr = data.requests;
      else if (Array.isArray(data.items)) arr = data.items;
      else if (data && typeof data === "object" && data._id) arr = [data]; // single doc
      else arr = [];

      // Filter to this bazaar (some endpoints might return all apps)
      const filtered = arr.filter((r) => String(getBazaarId(r)) === String(bazaarId));
      setRequests(filtered);
      if (filtered.length === 0) setError("No vendor requests for this bazaar.");
    } catch (err) {
      console.error("Failed to load vendor requests:", err);
      setError("Failed to load vendor requests. Please try again later.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bazaarId]);

  // Handle Accept/Reject actions
  const updateStatus = async (requestId, status) => {
    if (!requestId) return;
    if (!["accepted", "rejected", "pending"].includes(status)) {
      alert("Invalid status");
      return;
    }

    if (!window.confirm(`Are you sure you want to ${status.toUpperCase()} this request?`)) {
      return;
    }

    try {
      setProcessingId(requestId);

      // PATCH the application status on the backend
      const url = `http://localhost:3001/api/bazaar-applications/${requestId}`;
      const res = await axios.patch(url, { status });

      // If backend returns success, update local state
      if (res && (res.status === 200 || res.status === 201)) {
        // Update request in state (immutable update)
        setRequests((prev) =>
          prev.map((r) => (String(r._id) === String(requestId) ? { ...r, status } : r))
        );
      } else {
        console.warn("Unexpected response updating status:", res);
        alert("Failed to update request status.");
      }
    } catch (err) {
      console.error(`Failed to ${status} vendor request:`, err);
      alert(`Failed to ${status} vendor request. See console for details.`);
    } finally {
      setProcessingId(null);
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
              const vendorName = req.vendorName || firstAtt?.name || "Unknown Vendor";
              const vendorEmail = req.vendorEmail || firstAtt?.email || "No email provided";
              const boothSize = req.boothSize || "N/A";

              // Build a friendly description from available data
              const attendeesList = Array.isArray(req.attendees)
                ? req.attendees.map((a) => `${a.name} <${a.email}>`).join(", ")
                : "";
              const description =
                req.description || (boothSize ? `Booth: ${boothSize}. Attendees: ${attendeesList}` : "No description provided.");

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
                    <span
                      style={{
                        color: status === "accepted" ? "green" : status === "rejected" ? "red" : "gray",
                        fontWeight: "bold",
                      }}
                    >
                      {status}
                    </span>
                  </div>

                  {status === "pending" && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => updateStatus(req._id, "accepted")}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-60"
                        disabled={processingId === req._id}
                      >
                        {processingId === req._id ? "Processing..." : "Accept"}
                      </button>
                      <button
                        onClick={() => updateStatus(req._id, "rejected")}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-60"
                        disabled={processingId === req._id}
                      >
                        {processingId === req._id ? "Processing..." : "Reject"}
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
