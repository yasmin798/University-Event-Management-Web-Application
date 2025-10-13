// client/src/pages/VendorRequests.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { useLocalEvents } from "../hooks/useLocalEvents";

export default function VendorRequests() {
  const { id: bazaarId } = useParams();
  const navigate = useNavigate();
  const { list } = useLocalEvents();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await list(); // await async list()
        const arr = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];

        const allRequests = arr.filter(
          (r) => r.type === "VENDOR_REQUEST" && r.bazaarId === bazaarId
        );

        if (alive) setRequests(allRequests);
      } catch (e) {
        console.error("Failed to load vendor requests:", e);
        if (alive) setRequests([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [bazaarId, list]);

  function handleAccept(requestId) {
    alert(`Accepted vendor request ${requestId}`);
  }
  function handleReject(requestId) {
    alert(`Rejected vendor request ${requestId}`);
  }

  return (
    <div className="events-theme">
      <div className="container">
        <NavBar bleed />

        {/* Title + Back (matches your create forms) */}
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

        {requests.length === 0 ? (
          <p>No vendor requests for this bazaar.</p>
        ) : (
          <ul>
            {requests.map((req) => (
              <li key={req.id || req._id} style={{ marginBottom: "1rem" }}>
                <div>
                  <strong>Vendor Name:</strong> {req.vendorName}
                </div>
                <div>
                  <strong>Request Details:</strong> {req.details}
                </div>
                <button onClick={() => handleAccept(req.id || req._id)}>
                  Accept
                </button>
                <button onClick={() => handleReject(req.id || req._id)}>
                  Reject
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
