import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Menu, X, Search, LogOut, User as UserIcon } from "lucide-react";

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
        if (!idFiles[i]) throw new Error(`Please upload ID file for attendee ${i + 1}`);
      }

      const form = new FormData();
      form.append("platformSlot", platformSlot);
      form.append("durationWeeks", durationWeeks);
      form.append("boothSize", boothSize);
      form.append("attendees", JSON.stringify(attendees));
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
      if (!res.ok) throw new Error((data && data.error) || res.statusText || "Submission failed");

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
    <div className="events-theme" style={{ display: "flex", minHeight: "100vh" }}>
      {/* ==================== MOBILE SIDEBAR OVERLAY ==================== */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ==================== SIDEBAR (Permanent on desktop, toggle on mobile) ==================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#2f4156] text-white flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo / Title */}
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

        {/* Navigation Links (Vendor Options) */}
        <nav className="flex-1 px-4">
          <ul className="space-y-2">
            <li>
              <Link
                to="/vendors"
                className="block py-2 px-4 hover:bg-[#567c8d] rounded transition-colors"
              >
                Upcoming Bazaars
              </Link>
            </li>
            <li>
              <Link
                to="/apply-booth"
                className="block py-2 px-4 hover:bg-[#567c8d] rounded transition-colors"
              >
                Apply for Booth in Platform
              </Link>
            </li>
            <li>
              <Link
                to="/my-applications/accepted"
                className="block py-2 px-4 hover:bg-[#567c8d] rounded transition-colors"
              >
                View Applications
              </Link>
            </li>
            <li>
              <Link
                to="/guc-loyalty-apply"
                className="block py-2 px-4 hover:bg-[#567c8d] rounded transition-colors"
              >
                Apply for GUC Loyalty Program
              </Link>
            </li>
          </ul>
        </nav>

        {/* Logout */}
        <div className="px-4 pb-4">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-2 bg-[#c88585] hover:bg-[#b87575] text-white py-3 px-4 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ==================== MAIN AREA ==================== */}
      <main style={{ flex: 1, marginLeft: "260px", padding: "0 24px 24px" }}>
        {/* ---- Top Search & Info Bar (Mobile menu button) ---- */}
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
          {/* LEFT: Mobile menu + search */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
              flex: 1,
            }}
          >
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors md:hidden"
            >
              <Menu size={24} className="text-[#2f4156]" />
            </button>
            <div style={{ position: "relative", width: "260px", flex: 1, maxWidth: "100%" }}>
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
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 34px",
                  borderRadius: "10px",
                  border: "1px solid rgba(47,65,86,0.2)",
                  fontSize: "13px",
                }}
              />
            </div>
          </div>
          {/* RIGHT: user icon */}
          <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center">
            <UserIcon size={20} className="text-[#2f4156]" />
          </div>
        </header>

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