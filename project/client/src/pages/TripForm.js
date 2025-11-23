// client/src/pages/TripForm.js
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar"; // ✅ ADD SIDEBAR
import FormField from "../components/FormField";
import { validateTrip, isEditable } from "../utils/validation";
import "../events.theme.css";

export default function TripForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const editing = Boolean(id);
  const [filter, setFilter] = useState("All"); // sidebar filter state
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [data, setData] = useState({
    type: "TRIP",
    name: "",
    location: "",
    shortDescription: "",
    startDateTime: "",
    endDateTime: "",
    registrationDeadline: "",
    price: "",
    capacity: "",
   allowedRoles: [], // ADD THIS: Default to empty (open to all)
  });

  const [errors, setErrors] = useState({});
  const canEdit = isEditable(data.startDateTime);

  // ------------------------------
  // Load trip (editing mode)
  // ------------------------------
  useEffect(() => {
    let cancelled = false;

    if (!editing) return;

    (async () => {
      const r = await fetch(`/api/trips/${id}`, { cache: "no-store" });
      if (!r.ok) return;

      const doc = await r.json();
      if (cancelled) return;

      setData({
        type: "TRIP",
        name: doc.title || "",
        location: doc.location || "",
        shortDescription: doc.shortDescription || "",
        startDateTime: doc.startDateTime ? doc.startDateTime.slice(0, 16) : "",
        endDateTime: doc.endDateTime ? doc.endDateTime.slice(0, 16) : "",
        registrationDeadline: doc.registrationDeadline
          ? doc.registrationDeadline.slice(0, 16)
          : "",
        price: doc.price ?? "",
        capacity: doc.capacity ?? "",
       allowedRoles: doc.allowedRoles || [], // ADD THIS: Load from backend
      });
    })();

    return () => (cancelled = true);
  }, [editing, id]);

  // handle change
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
   if (type === "checkbox") { // ADD THIS: Handle checkbox for roles
     setData((d) => ({
       ...d,
       allowedRoles: checked
         ? [...d.allowedRoles, value]
         : d.allowedRoles.filter((r) => r !== value),
     }));
   } else {
      setData((d) => ({ ...d, [name]: value }));
   }
  }

  // save trip
  async function saveTrip() {
    const errs = validateTrip(data);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (!canEdit && editing) {
      alert("Trips can't be edited after the start time.");
      return;
    }

    const payload = {
      title: data.name,
      location: data.location,
      shortDescription: data.shortDescription,
      startDateTime: data.startDateTime,
      endDateTime: data.endDateTime,
      registrationDeadline: data.registrationDeadline,
      price: Number(data.price || 0),
      capacity: Number(data.capacity || 0),
   allowedRoles: data.allowedRoles, // ADD THIS: Include in payload
    };

    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/trips/${id}` : `/api/trips`;

    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const msg = await r.text().catch(() => "Failed to save trip");
      alert(msg);
      return;
    }

    navigate("/events", { replace: true });
  }

  // submit handler
  function handleSubmit(e) {
    e.preventDefault();

    const errs = validateTrip(data);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (!canEdit && editing) {
      alert("Trips can't be edited after the start time.");
      return;
    }

    setConfirmOpen(true);
  }

  return (
    <div
      className="events-theme"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      {/* 🟣 LEFT SIDEBAR */}
      <Sidebar filter={filter} setFilter={setFilter} />

      {/* 🟡 MAIN CONTENT */}
      <main style={{ flex: 1, marginLeft: "260px", padding: "24px" }}>
        <h1
          style={{ marginTop: 0, color: "var(--navy)", marginBottom: "18px" }}
        >
          {editing ? "Edit Trip" : "Create Trip"}
        </h1>

        {!canEdit && editing && (
          <div className="lock">
            This trip has started; editing is disabled.
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="form form-pro" noValidate>
          {/* Basic info */}
          <fieldset className="form-sec">
            <legend>Basic details</legend>

            <div className="form-grid">
              <FormField label="Name" error={errors.name} required>
                <input
                  name="name"
                  placeholder="e.g., Mountain Hiking Adventure"
                  value={data.name}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.name)}
                  disabled={!canEdit && editing}
                />
                <div className="help">Use a clear, descriptive title.</div>
              </FormField>

              <FormField label="Location" error={errors.location} required>
                <input
                  name="location"
                  placeholder="e.g., Blue Ridge Mountains"
                  value={data.location}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.location)}
                  disabled={!canEdit && editing}
                />
              </FormField>

              <FormField
                label="Short Description"
                error={errors.shortDescription}
              >
                <textarea
                  name="shortDescription"
                  rows={3}
                  placeholder="Brief overview of the trip."
                  value={data.shortDescription}
                  onChange={handleChange}
                  disabled={!canEdit && editing}
                />
              </FormField>
            </div>
          </fieldset>

          {/* Schedule */}
          <fieldset className="form-sec">
            <legend>Schedule</legend>

            <div className="form-grid form-grid-3">
              <FormField label="Start" error={errors.startDateTime} required>
                <input
                  type="datetime-local"
                  name="startDateTime"
                  value={data.startDateTime}
                  onChange={handleChange}
                  disabled={editing && !canEdit}
                />
              </FormField>

              <FormField label="End" error={errors.endDateTime} required>
                <input
                  type="datetime-local"
                  name="endDateTime"
                  value={data.endDateTime}
                  onChange={handleChange}
                  disabled={editing && !canEdit}
                />
              </FormField>

              <FormField
                label="Registration Deadline"
                error={errors.registrationDeadline}
              >
                <input
                  type="datetime-local"
                  name="registrationDeadline"
                  value={data.registrationDeadline}
                  onChange={handleChange}
                  disabled={!canEdit && editing}
                />
              </FormField>
            </div>
          </fieldset>

          {/* Pricing & Capacity */}
          <fieldset className="form-sec">
            <legend>Capacity & Pricing</legend>

            <div className="form-grid form-grid-2">
              <FormField label="Price" error={errors.price}>
                <input
                  type="number"
                  name="price"
                  placeholder="150"
                  value={data.price}
                  onChange={handleChange}
                  disabled={!canEdit && editing}
                />
              </FormField>

              <FormField label="Capacity" error={errors.capacity} required>
                <input
                  type="number"
                  name="capacity"
                  placeholder="40"
                  value={data.capacity}
                  onChange={handleChange}
                  disabled={!canEdit && editing}
                />
              </FormField>
            </div>
          </fieldset>

        {/* ADD THIS: Role Restrictions */}
       <fieldset className="form-sec">
          <legend>Role Restrictions</legend>
          <p className="help">Select roles allowed to register. Leave unchecked for open to all.</p>
          <div className="form-grid form-grid-2" style={{ display: "flex", flexWrap: "wrap" }}>
           {["student", "professor", "ta", "staff"].map((role) => (
               <label key={role} style={{ display: "flex", alignItems: "center", marginRight: "20px" }}>
                <input
               type="checkbox"
                  name="allowedRoles"
                   value={role}
                   checked={data.allowedRoles.includes(role)}
                   onChange={handleChange}
                   disabled={!canEdit && editing}
                 />
                 {role.charAt(0).toUpperCase() + role.slice(1)}s
               </label>
             ))}
           </div>
         </fieldset>

          {/* Submit */}
          <div className="form-actions">
            <button
              className="btn"
              type="submit"
              disabled={editing && !canEdit}
            >
              {editing ? "Save Changes" : "Create Trip"}
            </button>
          </div>
        </form>

        {/* Confirm modal */}
        {confirmOpen && (
          <div className="confirm-overlay">
            <div className="confirm">
              <h2>{editing ? "Save changes?" : "Create this trip?"}</h2>

              <p>
                {editing ? (
                  <>
                    Save edits to <strong>{data.name || "this trip"}</strong>?
                  </>
                ) : (
                  <>
                    Create <strong>{data.name || "this trip"}</strong>?
                  </>
                )}
              </p>

              <div className="confirm-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => setConfirmOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    setConfirmOpen(false);
                    saveTrip();
                  }}
                >
                  {editing ? "Save changes" : "Create trip"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}