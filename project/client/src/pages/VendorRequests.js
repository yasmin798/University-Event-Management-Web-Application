// client/src/pages/VendorRequests.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { useLocalEvents } from "../hooks/useLocalEvents";


export default function VendorRequests() {
  const { id: bazaarId } = useParams();
  const navigate = useNavigate();
  const { list } = useLocalEvents();


  // Assuming vendor requests are stored as events or in a similar local storage
  // You might want to replace this logic with your actual data source for vendor requests
  const [requests, setRequests] = useState([]);


  useEffect(() => {
    // TODO: Replace this with your logic to fetch vendor requests for bazaarId
    const allRequests = list().filter(
      (r) => r.type === "VENDOR_REQUEST" && r.bazaarId === bazaarId
    );
    setRequests(allRequests);
  }, [bazaarId, list]);


  function handleAccept(requestId) {
    // TODO: Implement accept logic, e.g., update request status
    alert(`Accepted vendor request ${requestId}`);
  }


  function handleReject(requestId) {
    // TODO: Implement reject logic, e.g., update request status
    alert(`Rejected vendor request ${requestId}`);
  }


  return (
    <div className="events-theme">
      <div className="container">
        <NavBar bleed />


        <h1>Vendor Participation Requests</h1>
        <button onClick={() => navigate(-1)}>← Back</button>


        {requests.length === 0 ? (
          <p>No vendor requests for this bazaar.</p>
        ) : (
          <ul>
            {requests.map((req) => (
              <li key={req.id} style={{ marginBottom: "1rem" }}>
                <div><strong>Vendor Name:</strong> {req.vendorName}</div>
                <div><strong>Request Details:</strong> {req.details}</div>
                <button onClick={() => handleAccept(req.id)}>Accept</button>
                <button onClick={() => handleReject(req.id)}>Reject</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}