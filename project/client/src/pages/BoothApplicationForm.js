// client/src/pages/BoothApplicationForm.js
import React, { useEffect, useState } from "react";
import {  useNavigate } from "react-router-dom";

const emptyAttendee = { name: "", email: "" };
const PLATFORM_SLOTS = ["B1", "B2", "B3", "B4", "B5"];

export default function BoothApplicationForm() {
 
  const navigate = useNavigate();

  

  const [attendees, setAttendees] = useState([{ ...emptyAttendee }]);
  const [durationWeeks, setDurationWeeks] = useState(1);
  const [platformSlot, setPlatformSlot] = useState("B1");
  const [boothSize, setBoothSize] = useState("2x2");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  

  const addAttendee = () => {
    if (attendees.length >= 5) return;
    setAttendees([...attendees, { ...emptyAttendee }]);
  };
  const removeAttendee = (idx) => {
    setAttendees(attendees.filter((_, i) => i !== idx));
  };
  const updateAttendee = (idx, field, value) => {
    setAttendees(attendees.map((a, i) => (i === idx ? { ...a, [field]: value } : a)));
  };

  const validate = () => {
    if (!platformSlot || !PLATFORM_SLOTS.includes(platformSlot)) return "Please choose a platform slot.";
    if (![1,2,3,4].includes(Number(durationWeeks))) return "Invalid duration.";
    if (!["2x2","4x4"].includes(boothSize)) return "Invalid booth size.";
    for (let i=0;i<attendees.length;i++){
      const a = attendees[i];
      if (!a.name || !a.email) return `Attendee ${i+1} needs name and email.`;
      if (!/^\S+@\S+\.\S+$/.test(a.email)) return `Attendee ${i+1} email is invalid.`;
    }
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
      const payload = {
    
        attendees,
        boothSize,
        durationWeeks: Number(durationWeeks),
        platformSlot,
      };

      const res = await fetch("http://localhost:3001/api/booth-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const bodyText = await res.text();
      let body;
      try { body = bodyText ? JSON.parse(bodyText) : null; } catch { body = bodyText; }

      if (!res.ok) {
        const serverMsg = (body && (body.error || body.message)) || res.statusText;
        throw new Error(serverMsg || `Submit failed: ${res.status}`);
      }

      setSuccessMsg("Booth application submitted!");
      setTimeout(() => navigate("/vendors"), 1200);
    } catch (err) {
      console.error("Submission error:", err);
      setError(err.message || "Error submitting application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow">
        <h1 className="text-2xl font-bold mb-4">Booth Application</h1>

       <h2 className="text-xl font-semibold mb-4">Booth Application Form</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block font-medium mb-2">Platform map — choose slot</label>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div style={{ maxWidth: 420 }}>
                {/* Put Platform.png in public/images/Platform.png */}
                <img
                     src="/Platform.png"
                        alt="Platform Map"
                 className="w-full max-w-2xl mx-auto rounded-lg shadow-lg my-4"
                    />                <p className="text-xs text-gray-500 mt-2">Click a slot below to select: B1, B2, B3, B4, B5</p>
              </div>

              <div className="flex-1">
                {PLATFORM_SLOTS.map((s) => (
                  <label key={s} className={`flex items-center gap-2 mb-2 p-2 border rounded ${platformSlot===s ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}>
                    <input
                      type="radio"
                      name="platformSlot"
                      value={s}
                      checked={platformSlot === s}
                      onChange={() => setPlatformSlot(s)}
                    />
                    <span className="font-medium">{s}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {/* Optional short descriptions */}
                      {s === "B1" && "Near entrance"}
                      {s === "B2" && "Center-left"}
                      {s === "B3" && "Center"}
                      {s === "B4" && "Center-right"}
                      {s === "B5" && "Near exit"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block font-medium mb-2">Duration (weeks)</label>
            <select value={durationWeeks} onChange={(e)=>setDurationWeeks(e.target.value)} className="p-2 border rounded">
              <option value={1}>1 week</option>
              <option value={2}>2 weeks</option>
              <option value={3}>3 weeks</option>
              <option value={4}>4 weeks</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block font-medium mb-2">Booth Size</label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input type="radio" name="boothSize" value="2x2" checked={boothSize==="2x2"} onChange={()=>setBoothSize("2x2")} />
                <span className="ml-2">2x2</span>
              </label>
              <label className="inline-flex items-center">
                <input type="radio" name="boothSize" value="4x4" checked={boothSize==="4x4"} onChange={()=>setBoothSize("4x4")} />
                <span className="ml-2">4x4</span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label className="block font-medium mb-2">Attendees (max 5)</label>
            {attendees.map((a, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center">
                <input type="text" placeholder={`Name ${idx+1}`} value={a.name} onChange={(e)=>updateAttendee(idx, "name", e.target.value)} className="flex-1 p-2 border rounded" />
                <input type="email" placeholder={`Email ${idx+1}`} value={a.email} onChange={(e)=>updateAttendee(idx, "email", e.target.value)} className="flex-1 p-2 border rounded" />
                {attendees.length > 1 && <button type="button" onClick={()=>removeAttendee(idx)} className="px-3 py-1 bg-red-500 text-white rounded">Remove</button>}
              </div>
            ))}
            <div>
              <button type="button" onClick={addAttendee} disabled={attendees.length>=5} className="mt-2 px-4 py-2 bg-gray-200 rounded disabled:opacity-50">Add Attendee</button>
            </div>
          </div>

          {error && <p className="text-red-500 mb-2">{error}</p>}
          {successMsg && <p className="text-green-600 mb-2">{successMsg}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded">
              {submitting ? "Submitting..." : "Submit Booth Application"}
            </button>
            <button type="button" onClick={()=>navigate(-1)} className="px-4 py-2 border rounded">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
