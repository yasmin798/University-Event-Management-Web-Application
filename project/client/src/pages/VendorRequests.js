// client/src/pages/VendorRequests.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { LogOut } from "lucide-react";
import "../events.theme.css";
import Sidebar from "../components/Sidebar";

export default function VendorRequests() {
  const { id: bazaarId } = useParams();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState("All");

  const getBazaarId = (req) => {
    if (!req) return null;
    if (req.bazaar && typeof req.bazaar === "string") return req.bazaar;
    if (req.bazaar && req.bazaar._id) return req.bazaar._id;
    if (req.bazaarId) return req.bazaarId;
    return null;
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

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
        } catch {
          continue;
        }
      }

      if (!data) throw new Error("No data returned.");

      let arr = [];
      if (Array.isArray(data)) arr = data;
      else if (Array.isArray(data.requests)) arr = data.requests;
      else if (Array.isArray(data.items)) arr = data.items;
      else if (data._id) arr = [data];

      const filtered = arr.filter(
        (r) => String(getBazaarId(r)) === String(bazaarId)
      );

      setRequests(filtered);
      if (filtered.length === 0)
        setError("No vendor requests for this bazaar.");
    } catch (err) {
      setError("Failed to load vendor requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [bazaarId]);

  const updateStatus = async (requestId, status) => {
    if (!window.confirm(`Are you sure to ${status}?`)) return;

    try {
      setProcessingId(requestId);
      const url = `http://localhost:3001/api/bazaar-applications/${requestId}`;
      const res = await axios.patch(url, { status });

      if (res?.status === 200 || res?.status === 201) {
        setRequests((prev) =>
          prev.map((r) =>
            String(r._id) === String(requestId) ? { ...r, status } : r
          )
        );
      }
    } catch (err) {
      console.error(err);
      alert("Update failed.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div
      className="events-theme"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      <Sidebar filter={filter} setFilter={setFilter} />

      {/* ---------- MAIN CONTENT (NO TOP PANEL) ---------- */}
      <main style={{ flex: 1, padding: "20px", marginLeft: "260px" }}>
        <h1>Vendor Participation Requests</h1>

        {loading ? (
          <p>Loading…</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : requests.length === 0 ? (
          <p>No vendor requests for this bazaar.</p>
        ) : (
          <ul className="space-y-4">
            {requests.map((req) => {
              const firstAtt = Array.isArray(req.attendees)
                ? req.attendees[0]
                : null;
              const vendorName =
                req.vendorName || firstAtt?.name || "Unknown Vendor";
              const vendorEmail =
                req.vendorEmail || firstAtt?.email || "No email";
              const boothSize = req.boothSize || "N/A";

              const attendeesList = Array.isArray(req.attendees)
                ? req.attendees.map((a) => `${a.name} <${a.email}>`).join(", ")
                : "";

              const description =
                req.description ||
                (boothSize
                  ? `Booth: ${boothSize}. Attendees: ${attendeesList}`
                  : "No description");

              const status = (req.status || "pending").toLowerCase();

              return (
                <li
                  key={req._id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
                >
                  <div>
                    <strong>Vendor Name:</strong> {vendorName}
                  </div>
                  <div>
                    <strong>Email:</strong> {vendorEmail}
                  </div>
                  <div>
                    <strong>Description:</strong> {description}
                  </div>
                  <div>
                    <strong>Status:</strong>{" "}
                    <span
                      style={{
                        color:
                          status === "accepted"
                            ? "green"
                            : status === "rejected"
                            ? "red"
                            : "gray",
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
                        className="btn"
                        disabled={processingId === req._id}
                      >
                        {processingId === req._id ? "Processing…" : "Accept"}
                      </button>
                      <button
                        onClick={() => updateStatus(req._id, "rejected")}
                        className="btn btn-outline"
                        disabled={processingId === req._id}
                      >
                        {processingId === req._id ? "Processing…" : "Reject"}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
