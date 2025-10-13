// client/src/pages/TripForm.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import FormField from "../components/FormField";
import { validateTrip, isEditable } from "../utils/validation";
import "../events.theme.css";

export default function TripForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const editing = Boolean(id);
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
  });
  const [errors, setErrors] = useState({});

  const canEdit = isEditable(data.startDateTime);

  // Load existing trip when editing (from backend)
  useEffect(() => {
    let cancelled = false;
    if (!editing) return;
    (async () => {
      const r = await fetch(`/api/trips/${id}`, { cache: "no-store" });
      if (!r.ok) return; // optionally show toast
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
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [editing, id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setData((d) => ({ ...d, [name]: value }));
  }

  async function saveTrip() {
    const errs = validateTrip(data);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (!canEdit && editing) {
      alert("Trips can’t be edited after the start time.");
      return;
    }

    const payload = {
      title: data.name, // backend expects 'title'
      location: data.location,
      shortDescription: data.shortDescription,
      startDateTime: data.startDateTime,
      endDateTime: data.endDateTime,
      registrationDeadline: data.registrationDeadline,
      price: Number(data.price || 0),
      capacity: Number(data.capacity || 0),
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

  function handleSubmit(e) {
    e.preventDefault();

    const errs = validateTrip(data);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (!canEdit && editing) {
      alert("Trips can’t be edited after the start time.");
      return;
    }

    setConfirmOpen(true);
  }

  return (
    <div className="events-theme">
      <div className="container">
        <NavBar bleed />

        <div className="eo-head-row">
          <h1>{editing ? "Edit Trip" : "Create Trip"}</h1>
          <button
            type="button"
            className="btn btn-outline eo-back"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            Back
          </button>
        </div>

        {!canEdit && editing && (
          <div className="lock">
            This trip has started; editing is disabled.
          </div>
        )}

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
                  autoComplete="off"
                />
                <div className="help">Use a clear, descriptive title.</div>
              </FormField>

              <FormField label="Location" error={errors.location} required>
                <input
                  name="location"
                  placeholder="e.g., Blue Ridge Mountains, NC"
                  value={data.location}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.location)}
                  disabled={!canEdit && editing}
                />
                <div className="help">Destination or meeting point.</div>
              </FormField>

              <FormField
                label="Short Description"
                error={errors.shortDescription}
              >
                <textarea
                  name="shortDescription"
                  placeholder="Brief overview of the trip experience."
                  value={data.shortDescription}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.shortDescription)}
                  rows={3}
                  disabled={!canEdit && editing}
                />
                <div className="help">This appears in the events list.</div>
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
                  aria-invalid={Boolean(errors.startDateTime)}
                  disabled={editing && !canEdit}
                />
              </FormField>

              <FormField label="End" error={errors.endDateTime} required>
                <input
                  type="datetime-local"
                  name="endDateTime"
                  value={data.endDateTime}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.endDateTime)}
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
                  aria-invalid={Boolean(errors.registrationDeadline)}
                  disabled={editing && !canEdit}
                />
              </FormField>
            </div>
          </fieldset>

          {/* Capacity & pricing */}
          <fieldset className="form-sec">
            <legend>Capacity & pricing</legend>

            <div className="form-grid form-grid-2">
              <FormField label="Price" error={errors.price}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="price"
                  placeholder="e.g., 150.00"
                  value={data.price}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.price)}
                  disabled={!canEdit && editing}
                />
                <div className="help">Leave 0 for free trips.</div>
              </FormField>

              <FormField label="Capacity" error={errors.capacity} required>
                <input
                  type="number"
                  min="1"
                  step="1"
                  name="capacity"
                  placeholder="e.g., 40"
                  value={data.capacity}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.capacity)}
                  disabled={!canEdit && editing}
                />
                <div className="help">Maximum number of attendees.</div>
              </FormField>
            </div>
          </fieldset>

          {/* Actions */}
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
          <div className="confirm-overlay" role="dialog" aria-modal="true">
            <div className="confirm">
              <h2>{editing ? "Save changes?" : "Create this trip?"}</h2>
              <p>
                {editing ? (
                  <>
                    Are you sure you want to save these edits to{" "}
                    <strong>{data.name || "this trip"}</strong>?
                  </>
                ) : (
                  <>
                    Are you sure you want to create{" "}
                    <strong>{data.name || "this trip"}</strong>?
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
      </div>
    </div>
  );
}
