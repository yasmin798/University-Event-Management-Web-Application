import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const emptyAttendee = { name: "", email: "" };

const BazaarApplicationForm = () => {
  const { bazaarId } = useParams();
  const navigate = useNavigate();

  const [filter, setFilter] = useState("All"); // sidebar
  const [bazaar, setBazaar] = useState(null);
  const [loadingBazaar, setLoadingBazaar] = useState(true);
  const [attendees, setAttendees] = useState([{ ...emptyAttendee }]);
  const [boothSize, setBoothSize] = useState("2x2");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchBazaar = async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/api/bazaars/${bazaarId}`
        );
        if (!res.ok) throw new Error("Failed to fetch bazaar");
        const data = await res.json();
        setBazaar(data);
      } catch (err) {
        setError("Could not load bazaar details.");
      } finally {
        setLoadingBazaar(false);
      }
    };
    fetchBazaar();
  }, [bazaarId]);

  const addAttendee = () => {
    if (attendees.length < 5)
      setAttendees([...attendees, { ...emptyAttendee }]);
  };

  const removeAttendee = (idx) => {
    setAttendees(attendees.filter((_, i) => i !== idx));
  };

  const updateAttendee = (idx, field, value) => {
    setAttendees(
      attendees.map((a, i) => (i === idx ? { ...a, [field]: value } : a))
    );
  };

  const validate = () => {
    for (let i = 0; i < attendees.length; i++) {
      const a = attendees[i];
      if (!a.name || !a.email)
        return `Attendee ${i + 1} requires name & email.`;
      if (!/^\S+@\S+\.\S+$/.test(a.email))
        return `Attendee ${i + 1} email invalid.`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const v = validate();
    if (v) return setError(v);

    setSubmitting(true);
    try {
      const payload = {
        bazaar: bazaarId,
        attendees,
        boothSize,
      };

      const res = await fetch("http://localhost:3001/api/bazaar-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Submission failed");

      setSuccessMsg("Application submitted!");
      setTimeout(() => navigate("/vendors"), 1200);
    } catch (err) {
      setError("Failed submitting application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* LEFT SIDEBAR */}
      <Sidebar filter={filter} setFilter={setFilter} />

      {/* CONTENT */}
      <main
        style={{
          flex: 1,
          marginLeft: "260px",
          padding: "24px",
          background: "#f8f9fa",
        }}
      >
        <h1 className="text-2xl font-bold mb-5">Bazaar Application</h1>

        {loadingBazaar ? (
          <p>Loading bazaar details…</p>
        ) : bazaar ? (
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{bazaar.title}</h2>
            <p className="text-sm">{bazaar.location}</p>
            <p className="text-sm">
              {new Date(bazaar.startDateTime).toLocaleString()} —{" "}
              {new Date(bazaar.endDateTime).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="text-red-500">Bazaar not found.</p>
        )}

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl shadow"
        >
          {/* ATTENDEES */}
          <div className="mb-5">
            <label className="font-semibold block mb-2">
              Attendees (max 5)
            </label>

            {attendees.map((att, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  className="border p-2 rounded flex-1"
                  placeholder={`Name ${idx + 1}`}
                  value={att.name}
                  onChange={(e) => updateAttendee(idx, "name", e.target.value)}
                />

                <input
                  className="border p-2 rounded flex-1"
                  placeholder="Email"
                  value={att.email}
                  onChange={(e) => updateAttendee(idx, "email", e.target.value)}
                />

                {attendees.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAttendee(idx)}
                    className="bg-red-500 text-white px-3 rounded"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addAttendee}
              className="bg-gray-200 px-4 py-2 rounded"
              disabled={attendees.length >= 5}
            >
              Add Attendee
            </button>
          </div>

          {/* BOOTH SIZE */}
          <div className="mb-5">
            <label className="font-semibold block mb-2">Booth Size</label>

            <div className="flex gap-5">
              <label>
                <input
                  type="radio"
                  name="booth"
                  checked={boothSize === "2x2"}
                  onChange={() => setBoothSize("2x2")}
                />{" "}
                2×2
              </label>

              <label>
                <input
                  type="radio"
                  name="booth"
                  checked={boothSize === "4x4"}
                  onChange={() => setBoothSize("4x4")}
                />{" "}
                4×4
              </label>
            </div>
          </div>

          {error && <p className="text-red-500 mb-3">{error}</p>}
          {successMsg && <p className="text-green-600 mb-3">{successMsg}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit Application"}
            </button>

            <button
              type="button"
              className="px-4 py-2 border rounded"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default BazaarApplicationForm;
