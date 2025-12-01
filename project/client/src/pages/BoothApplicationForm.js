import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Menu, X, Search, LogOut, User as UserIcon } from "lucide-react";
import VendorSidebar from "../components/VendorSidebar";
const BoothApplicationForm = () => {
  const navigate = useNavigate();

  const [platformSlot, setPlatformSlot] = useState("B1");
  const [durationWeeks, setDurationWeeks] = useState("1");
  const [boothSize, setBoothSize] = useState("2x2");
  const [attendees, setAttendees] = useState([{ name: "", email: "" }]);
  const [idFiles, setIdFiles] = useState([null]);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [startDate, setStartDate] = useState("");

  const addAttendee = () => {
    if (attendees.length < 5)
      setAttendees([...attendees, { name: "", email: "" }]);
    setIdFiles((s) => [...s, null]);
  };

  const updateAttendee = (index, field, value) => {
    setAttendees(
      attendees.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  };

  const removeAttendee = (i) => {
    setAttendees(attendees.filter((_, idx) => idx !== i));
    // also remove file
    setIdFiles((s) => s.filter((_, idx) => idx !== i));
  };

  const onFileChange = (index, file) => {
    setIdFiles((prev) => prev.map((f, i) => (i === index ? file : f)));
  };

  const validate = () => {
    for (let i = 0; i < attendees.length; i++) {
      if (!attendees[i].name || !attendees[i].email)
        return `Attendee ${i + 1} must have name & email`;

      if (!/^\S+@\S+\.\S+$/.test(attendees[i].email))
        return `Invalid email for attendee ${i + 1}`;
    }
    return null;
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setError("");

    const v = validate();
    if (v) return setError(v);

    setSubmitting(true);

    try {
      for (let i = 0; i < attendees.length; i++) {
        if (!idFiles[i])
          throw new Error(`Please upload ID file for attendee ${i + 1}`);
      }

      const form = new FormData();
      form.append("platformSlot", platformSlot);
      form.append("durationWeeks", durationWeeks);
      form.append("boothSize", boothSize);
      form.append("attendees", JSON.stringify(attendees));
      form.append("startDateTime", new Date(startDate).toISOString());



      idFiles.forEach((f) => form.append("idFiles", f));

      const res = await fetch("http://localhost:3001/api/booth-applications", {
        method: "POST",
        body: form,
      });

      const dataText = await res.text();
      let data;
      try {
        data = dataText ? JSON.parse(dataText) : {};
      } catch (_e) {
        data = dataText;
      }
      if (!res.ok)
        throw new Error(
          (data && data.error) || res.statusText || "Submission failed"
        );

      setSuccessMsg("Application submitted!");
      setTimeout(() => navigate("/vendors"), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => navigate("/vendors");

  return (
    <div
      className="events-theme"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      <VendorSidebar
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        fetchBazaars={() => {}}
      />
      {/* ==================== MAIN AREA ==================== */}
      <main style={{ flex: 1, marginLeft: "260px", padding: "0 24px 24px" }}>
        <h1 className="text-2xl font-bold mb-6">Booth Application</h1>
        <h2 className="text-xl mb-6 font-semibold">Booth Application Form</h2>

        <form
          onSubmit={submitForm}
          className="bg-white rounded-xl p-8 shadow-md"
        >
          {/* ================= PLATFORM MAP + SLOT SELECT ================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* LEFT: platform map image */}
            <div className="flex justify-center">
              <img
                src="/Platform.png"
                alt="Platform Map"
                className="w-[320px]"
              />
            </div>

            {/* RIGHT: slot radio buttons */}
            <div className="space-y-4">
              <p className="font-semibold">Platform map — choose slot</p>

              {["B1", "B2", "B3", "B4", "B5"].map((slot) => (
                <label
                  key={slot}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="slot"
                    value={slot}
                    checked={platformSlot === slot}
                    onChange={() => setPlatformSlot(slot)}
                  />
                  <span>
                    {slot}{" "}
                    {slot === "B1"
                      ? "Near entrance"
                      : slot === "B2"
                      ? "Center-left"
                      : slot === "B3"
                      ? "Center"
                      : slot === "B4"
                      ? "Center-right"
                      : "Near exit"}
                  </span>
                </label>
              ))}
            </div>
          </div>


          {/* ================== DURATION ================== */}
          <div className="mb-6">
            <label className="font-semibold block mb-2">Duration (weeks)</label>
            <select
              className="border p-2 rounded w-full"
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(e.target.value)}
            >
              <option value="1">1 week</option>
              <option value="2">2 weeks</option>
              <option value="3">3 weeks</option>
              <option value="4">4 weeks</option>
            </select>
          </div>
          <div className="mb-6">
  <label className="font-semibold block mb-2">
    Booth Start Date
  </label>
  <input
    type="datetime-local"
    className="border p-2 rounded w-full"
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
    required
  />
</div>
          {/* ================== BOOTH SIZE ================== */}
          <div className="mb-6">
            <label className="font-semibold block mb-2">Booth Size</label>

            <div className="flex gap-5">
              <label>
                <input
                  type="radio"
                  name="boothSize"
                  value="2x2"
                  checked={boothSize === "2x2"}
                  onChange={() => setBoothSize("2x2")}
                />{" "}
                2×2
              </label>

              <label>
                <input
                  type="radio"
                  name="boothSize"
                  value="4x4"
                  checked={boothSize === "4x4"}
                  onChange={() => setBoothSize("4x4")}
                />{" "}
                4×4
              </label>
            </div>
          </div>

          {/* ================== ATTENDEES ================== */}
          <div className="mb-6">
            <label className="font-semibold block mb-3">
              Attendees (max 5)
            </label>

            {attendees.map((att, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  className="border p-2 rounded flex-1"
                  placeholder={`Name ${i + 1}`}
                  value={att.name}
                  onChange={(e) => updateAttendee(i, "name", e.target.value)}
                />

                <input
                  className="border p-2 rounded flex-1"
                  placeholder="Email"
                  value={att.email}
                  onChange={(e) => updateAttendee(i, "email", e.target.value)}
                />

                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => onFileChange(i, e.target.files[0] || null)}
                />

                {attendees.length > 1 && (
                  <button
                    type="button"
                    className="bg-red-500 text-white px-3 rounded"
                    onClick={() => removeAttendee(i)}
                  >
                    ✕
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

          {error && <p className="text-red-500 mb-3">{error}</p>}
          {successMsg && <p className="text-green-600 mb-3">{successMsg}</p>}

          {/* BUTTONS */}
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-5 py-2 rounded"
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit Booth Application"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2 border rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default BoothApplicationForm;
