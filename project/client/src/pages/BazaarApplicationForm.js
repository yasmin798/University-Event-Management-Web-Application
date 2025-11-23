// client/src/pages/BazaarApplicationForm.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Menu, X, LogOut, Search, User as UserIcon } from "lucide-react";

const emptyAttendee = { name: "", email: "" };

const BazaarApplicationForm = () => {
  const { bazaarId } = useParams();
  const navigate = useNavigate();

  const [bazaar, setBazaar] = useState(null);
  const [loadingBazaar, setLoadingBazaar] = useState(true);
  const [attendees, setAttendees] = useState([{ ...emptyAttendee }]);
  const [idFiles, setIdFiles] = useState([null]);
  const [boothSize, setBoothSize] = useState("2x2");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchBazaar = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/bazaars/${bazaarId}`);
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
    setAttendees((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  };

  const onFileChange = (i, file) => {
    setIdFiles((prev) => prev.map((f, idx) => (idx === i ? file : f)));
  };

  const validate = () => {
    if (!bazaarId) return "Missing bazaar ID.";
    for (let i = 0; i < attendees.length; i++) {
      const a = attendees[i];
      if (!a.name || !a.email) return `Attendee ${i + 1} requires name and email.`;
      if (!/^\S+@\S+\.\S+$/.test(a.email))
        return `Attendee ${i + 1} email is invalid.`;
    }
    if (!["2x2", "4x4"].includes(boothSize)) return "Invalid booth size.";
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
        if (!idFiles[i]) throw new Error(`Please upload ID file for attendee ${i + 1}`);
      }

      const form = new FormData();
      form.append("bazaar", bazaarId);
      form.append("boothSize", boothSize);
      form.append("attendees", JSON.stringify(attendees));
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
      setError(err.message || "Error submitting application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="events-theme" style={{ display: "flex", minHeight: "100vh" }}>
      {/* ======= MOBILE OVERLAY ======= */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ======= SIDEBAR ======= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#2f4156] text-white flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#567c8d] rounded-full" />
            <span className="text-xl font-bold">Vendor Hub</span>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-2 hover:bg-[#567c8d] rounded-lg md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4">
          <ul className="space-y-2">
            <li>
              <Link
                to="/vendors"
                className="block py-2 px-4 hover:bg-[#567c8d] rounded"
              >
                Upcoming Bazaars
              </Link>
            </li>

            <li>
              <Link
                to="/apply-booth"
                className="block py-2 px-4 hover:bg-[#567c8d] rounded"
              >
                Apply for Booth in Platform
              </Link>
            </li>

            <li>
              <Link
                to="/my-applications/accepted"
                className="block py-2 px-4 hover:bg-[#567c8d] rounded"
              >
                View Applications
              </Link>
            </li>

            <li>
              <Link
                to="/guc-loyalty-apply"
                className="block py-2 px-4 hover:bg-[#567c8d] rounded"
              >
                Apply for GUC Loyalty Program
              </Link>
            </li>
          </ul>
        </nav>

        <div className="px-4 pb-4">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-2 bg-[#c88585] hover:bg-[#b87575] py-3 px-4 rounded-lg"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* ====== MAIN CONTENT ====== */}
      <main style={{ flex: 1, marginLeft: "260px", padding: "0 24px 24px" }}>
        {/* HEADER (same as your other page) */}
        <header
          style={{
            marginLeft: "-24px",
            marginRight: "-24px",
            width: "calc(100% + 48px)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--card)",
            borderRadius: "0 0 16px 16px",
            boxShadow: "var(--shadow)",
            padding: "10px 20px",
            marginBottom: "20px",
            position: "sticky",
            top: 0,
            zIndex: 5,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flex: 1,
            }}
          >
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 hover:bg-[#f5efeb] rounded-lg md:hidden"
            >
              <Menu size={24} className="text-[#2f4156]" />
            </button>

            <div style={{ position: "relative", width: "260px", flex: 1 }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "10px",
                  transform: "translateY(-50%)",
                  color: "var(--teal)",
                }}
              />
              <input
                type="text"
                placeholder="Search..."
                className="w-full p-2 pl-8 border rounded-lg"
              />
            </div>
          </div>

          <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center">
            <UserIcon size={20} className="text-[#2f4156]" />
          </div>
        </header>

        {/* YOUR ORIGINAL FORM STARTS HERE */}
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow">
          <h1 className="text-2xl font-bold mb-4">Bazaar Application</h1>

          {loadingBazaar ? (
            <p>Loading bazaar details...</p>
          ) : bazaar ? (
            <div className="mb-4">
              <h2 className="text-xl font-semibold">{bazaar.title}</h2>
              <p className="text-sm text-gray-600">{bazaar.location}</p>
              <p className="text-sm text-gray-600">
                {new Date(bazaar.startDateTime).toLocaleString()} -{" "}
                {new Date(bazaar.endDateTime).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-red-500">Bazaar not found.</p>
          )}

          <form onSubmit={handleSubmit}>
            {/* --- Attendees --- */}
            <div className="mb-4">
              <label className="block font-medium mb-2">Attendees (max 5)</label>

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
                className="mt-2 px-4 py-2 bg-gray-200 rounded"
              >
                Add Attendee
              </button>
            </div>

            {/* Booth size */}
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
            {successMsg && <p className="text-green-600 mb-2">{successMsg}</p>}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>

              <button
                type="button"
                onClick={() => navigate(-1)}
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
