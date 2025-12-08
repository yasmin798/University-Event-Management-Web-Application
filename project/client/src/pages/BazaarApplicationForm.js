// client/src/pages/BazaarApplicationForm.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VendorSidebar from "../components/VendorSidebar";

const emptyAttendee = { name: "", email: "" };

const BazaarApplicationForm = () => {
  const { bazaarId } = useParams();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [bazaar, setBazaar] = useState(null);
  const [loadingBazaar, setLoadingBazaar] = useState(true);
  const [attendees, setAttendees] = useState([{ ...emptyAttendee }]);
  const [idFiles, setIdFiles] = useState([null]);
  const [boothSize, setBoothSize] = useState("2x2");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [vendorDescription, setVendorDescription] = useState(""); // ✅ NEW

  // Fetch bazaar
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
        console.error(err);
        setError("Could not load bazaar details.");
      } finally {
        setLoadingBazaar(false);
      }
    };
    fetchBazaar();
  }, [bazaarId]);

  const addAttendee = () => {
    if (attendees.length >= 5) return;
    setAttendees([...attendees, { ...emptyAttendee }]);
    setIdFiles((s) => [...s, null]);
  };

  const removeAttendee = (index) => {
    setAttendees(attendees.filter((_, i) => i !== index));
    setIdFiles((s) => s.filter((_, i) => i !== index));
  };

  const updateAttendee = (index, field, value) => {
    const updated = attendees.map((a, i) =>
      i === index ? { ...a, [field]: value } : a
    );
    setAttendees(updated);
  };

  const onFileChange = (index, file) => {
    setIdFiles((prev) => prev.map((f, i) => (i === index ? file : f)));
  };

  const validate = () => {
    if (!bazaarId) return "Missing bazaar ID.";

    for (let i = 0; i < attendees.length; i++) {
      if (!attendees[i].name || !attendees[i].email)
        return `Attendee ${i + 1} requires name & email`;
      if (!/^\S+@\S+\.\S+$/.test(attendees[i].email))
        return `Invalid email for attendee ${i + 1}`;
    }

    if (!["2x2", "4x4"].includes(boothSize)) return "Invalid booth size";

    // ✅ You can enforce description as required if you want:
    // if (!vendorDescription.trim()) {
    //   return "Please describe your company and what you will offer.";
    // }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const v = validate();
    if (v) return setError(v);

    setSubmitting(true);

    try {
      for (let i = 0; i < attendees.length; i++) {
        if (!idFiles[i])
          throw new Error(`Upload ID file for attendee ${i + 1}`);
      }

      const form = new FormData();
      form.append("bazaar", bazaarId);
      form.append("boothSize", boothSize);
      form.append("attendees", JSON.stringify(attendees));
      form.append("vendorDescription", vendorDescription); // ✅ NEW
      idFiles.forEach((f) => form.append("idFiles", f));

      const res = await fetch("http://localhost:3001/api/bazaar-applications", {
        method: "POST",
        body: form,
      });

      const text = await res.text();
      let body;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }

      if (!res.ok) {
        const msg =
          (body && body.message) ||
          (typeof body === "string" && body) ||
          res.statusText;
        throw new Error(msg);
      }

      setSuccessMsg("Application submitted successfully!");
      setTimeout(() => navigate("/vendors"), 1200);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error submitting application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="events-theme flex min-h-screen">
      {/* === VENDOR SIDEBAR === */}
      <VendorSidebar
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        fetchBazaars={() => {}}
      />

      {/* === MAIN CONTENT === */}
      <main className="flex-1 ml-0 md:ml-[260px] p-6 bg-gray-50">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow">
          <h1 className="text-2xl font-bold mb-4">Bazaar Application</h1>

          {loadingBazaar ? (
            <p>Loading bazaar details...</p>
          ) : bazaar ? (
            <div className="mb-4">
              <h2 className="text-xl font-semibold">{bazaar.title}</h2>
              <p className="text-sm text-gray-600">{bazaar.location}</p>
              <p className="text-sm text-gray-600">
                {new Date(bazaar.startDateTime).toLocaleString()} –{" "}
                {new Date(bazaar.endDateTime).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-red-500">Bazaar not found.</p>
          )}

          <form onSubmit={handleSubmit}>
            {/* ✅ Company / Offer Description */}
            <div className="mb-4">
              <label className="block font-medium mb-2">
                Company Description / What you will offer
              </label>
              <textarea
                value={vendorDescription}
                onChange={(e) => setVendorDescription(e.target.value)}
                placeholder="Describe your brand, what you do, and what you will offer at this bazaar..."
                className="w-full p-2 border rounded min-h-[100px] text-sm"
              />
            </div>

            {/* Attendees */}
            <div className="mb-4">
              <label className="block font-medium mb-2">
                Attendees (max 5)
              </label>
              {attendees.map((att, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-center">
                  <input
                    type="text"
                    placeholder={`Name ${idx + 1}`}
                    value={att.name}
                    onChange={(e) =>
                      updateAttendee(idx, "name", e.target.value)
                    }
                    className="flex-1 p-2 border rounded"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={att.email}
                    onChange={(e) =>
                      updateAttendee(idx, "email", e.target.value)
                    }
                    className="flex-1 p-2 border rounded"
                  />
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) =>
                      onFileChange(idx, e.target.files[0] || null)
                    }
                    className="ml-2"
                  />
                  {attendees.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAttendee(idx)}
                      className="px-3 py-1 bg-red-500 text-white rounded"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addAttendee}
                disabled={attendees.length >= 5}
                className="mt-2 px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Add Attendee
              </button>
            </div>

            {/* Booth Size */}
            <div className="mb-4">
              <label className="block font-medium mb-2">Booth Size</label>
              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="boothSize"
                    value="2x2"
                    checked={boothSize === "2x2"}
                    onChange={() => setBoothSize("2x2")}
                  />
                  <span className="ml-2">2x2</span>
                </label>

                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="boothSize"
                    value="4x4"
                    checked={boothSize === "4x4"}
                    onChange={() => setBoothSize("4x4")}
                  />
                  <span className="ml-2">4x4</span>
                </label>
              </div>
            </div>

            {error && <p className="text-red-500 mb-2">{error}</p>}
            {successMsg && (
              <p className="text-green-600 mb-2">{successMsg}</p>
            )}

            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/vendors")}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default BazaarApplicationForm;
